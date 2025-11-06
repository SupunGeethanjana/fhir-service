import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  InitializeRequestSchema,
  isInitializeRequest,
  JSONRPCError,
  ListToolsRequestSchema,
  LoggingMessageNotification,
} from '@modelcontextprotocol/sdk/types.js';
import { randomUUID } from 'crypto';
import express, { Request, Response } from 'express';

const SESSION_ID_HEADER_NAME = 'mcp-session-id';

class MCPServer {
  server: Server;
  // to support multiple simultaneous connections
  transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};

  constructor(server: Server) {
    this.server = server;
    this.setupTools();
  }

  async handleGetRequest(req: Request, res: Response) {
    console.log('GET request received');

    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;
    if (!sessionId || !this.transports[sessionId]) {
      res
        .status(400)
        .json(
          this.createErrorResponse('Bad Request: invalid session ID or method.')
        );
      return;
    }

    console.log(`Establishing SSE stream for session ${sessionId}`);
    const transport = this.transports[sessionId];
    await transport.handleRequest(req, res);
    return;
  }

  async handlePostRequest(req: Request, res: Response) {
    console.log('POST request received');
    console.log('body: ', req.body);

    const sessionId = req.headers[SESSION_ID_HEADER_NAME] as string | undefined;

    // If no sessionId and this is an initialize request, create new transport
    if (!sessionId && isInitializeRequest(req.body)) {
      console.log('Creating new transport for initialization request');
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          console.log(`Session initialized with ID: ${sessionId}`);
          this.transports[sessionId] = transport;
        },
      });

      // Set up onclose handler to clean up transport when closed
      transport.onclose = () => {
        const sid = transport.sessionId;
        if (sid && this.transports[sid]) {
          console.log(
            `Transport closed for session ${sid}, removing from transports map`
          );
          delete this.transports[sid];
        }
      };

      await this.server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Use existing transport
    if (sessionId && this.transports[sessionId]) {
      const transport = this.transports[sessionId];
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // Invalid session
    res
      .status(400)
      .json(
        this.createErrorResponse('Bad Request: invalid session ID or method.')
      );
  }

  private setupTools() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'welcome',
            description: 'Welcome tool that says hello to Ayaan',
            inputSchema: {
              type: 'object',
              properties: {},
            },
          },
          {
            name: 'fetch-patient-mrns',
            description: 'Fetch all patient MRNs from the FHIR service',
            inputSchema: {
              type: 'object',
              properties: {
                system: {
                  type: 'string',
                  description:
                    'The MRN system identifier (default: http://moh.gov.sa/mrn)',
                  default: 'http://moh.gov.sa/mrn',
                },
                baseUrl: {
                  type: 'string',
                  description:
                    'The base URL of the FHIR service (default: http://localhost:3300)',
                  default: 'http://localhost:3300',
                },
              },
            },
          },
          {
            name: 'fetch-patient-data',
            description:
              'Fetch comprehensive patient data by MRN using GraphQL query',
            inputSchema: {
              type: 'object',
              properties: {
                mrn: {
                  type: 'string',
                  description: 'The patient MRN (Medical Record Number)',
                },
                system: {
                  type: 'string',
                  description:
                    'The MRN system identifier (default: http://moh.gov.sa/mrn)',
                  default: 'http://moh.gov.sa/mrn',
                },
                baseUrl: {
                  type: 'string',
                  description:
                    'The base URL of the FHIR service (default: http://localhost:3300)',
                  default: 'http://localhost:3300',
                },
              },
              required: ['mrn'],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request, extra) => {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'welcome':
            return {
              content: [{ type: 'text', text: 'Hello Ayaan' }],
            };

          case 'fetch-patient-mrns':
            return await this.fetchPatientMRNs(args, extra);

          case 'fetch-patient-data':
            return await this.fetchPatientData(args, extra);

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      }
    );
  }

  private async fetchPatientMRNs(
    args: Record<string, unknown>,
    extra: {
      sendNotification?: (message: LoggingMessageNotification) => Promise<void>;
    }
  ) {
    try {
      const system = (args.system as string) || 'http://moh.gov.sa/mrn';
      const baseUrl = (args.baseUrl as string) || 'http://localhost:3300';
      const encodedSystem = encodeURIComponent(system);
      const url = `${baseUrl}/fhir-service/Patient/all-mrns?system=${encodedSystem}`;

      // Send progress notification
      if (extra?.sendNotification) {
        const progressMessage: LoggingMessageNotification = {
          method: 'notifications/message',
          params: { level: 'info', data: `Fetching patient MRNs from: ${url}` },
        };
        await extra.sendNotification(progressMessage);
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        content: [
          {
            type: 'text',
            text: 'Successfully fetched patient MRNs',
          },
          {
            type: 'resource',
            resource: {
              uri: `fhir://patient-mrns?system=${encodeURIComponent(system)}`,
              mimeType: 'application/json',
              text: JSON.stringify(data, null, 2),
            },
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching patient MRNs: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  private async fetchPatientData(
    args: Record<string, unknown>,
    extra: {
      sendNotification?: (message: LoggingMessageNotification) => Promise<void>;
    }
  ) {
    try {
      const mrn = args.mrn as string;
      const system = (args.system as string) || 'http://moh.gov.sa/mrn';
      const baseUrl = (args.baseUrl as string) || 'http://localhost:3300';
      const url = `${baseUrl}/fhir-service/graphql`;

      // Send progress notification
      if (extra?.sendNotification) {
        const progressMessage: LoggingMessageNotification = {
          method: 'notifications/message',
          params: {
            level: 'info',
            data: `Fetching patient data for MRN: ${mrn}`,
          },
        };
        await extra.sendNotification(progressMessage);
      }

      const graphqlQuery = `
        query ($mrn: String!, $system: String) {
          patientByMrn(mrn: $mrn, system: $system) {
            patient {
              id
              resourceType
              resource
              lastUpdated
            }
            encounters {
              id
              resource
              lastUpdated
            }
            conditions {
              id
              resource
              lastUpdated
            }
            observations {
              id
              resource
              lastUpdated
            }
            allergies {
              id
              resource
              lastUpdated
            }
            medications {
              id
              resource
              lastUpdated
            }
            procedures {
              id
              resource
              lastUpdated
            }
            familyHistory {
              id
              resource
              lastUpdated
            }
            diagnosticReports {
              id
              resource
              lastUpdated
            }
            medicationRequests {
              id
              resource
              lastUpdated
            }
            serviceRequests {
              id
              resource
              lastUpdated
            }
            appointments {
              id
              resource
              lastUpdated
            }
            compositions {
              id
              resource
              lastUpdated
            }
            practitioners {
              id
              resource
              lastUpdated
            }
          }
        }
      `;

      const requestBody = {
        query: graphqlQuery,
        variables: {
          mrn,
          system,
        },
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        throw new Error(
          `HTTP error! status: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      // Check for GraphQL errors
      if (data.errors) {
        throw new Error(
          `GraphQL errors: ${data.errors
            .map((e: { message: string }) => e.message)
            .join(', ')}`
        );
      }

      return {
        content: [
          {
            type: 'text',
            text: `Successfully fetched patient data for MRN: ${mrn}`,
          },
          {
            type: 'resource',
            resource: {
              uri: `fhir://patient-data/${encodeURIComponent(
                mrn
              )}?system=${encodeURIComponent(system)}`,
              mimeType: 'application/json',
              text: JSON.stringify(data, null, 2),
            },
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error fetching patient data: ${(error as Error).message}`,
          },
        ],
      };
    }
  }

  private createErrorResponse(message: string): JSONRPCError {
    return {
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: message,
      },
      id: randomUUID(),
    };
  }

  private isInitializeRequest(body: unknown): boolean {
    const isInitial = (data: unknown) => {
      try {
        const result = InitializeRequestSchema.safeParse(data);
        return result.success;
      } catch {
        return false;
      }
    };

    if (Array.isArray(body)) {
      return body.some((request) => isInitial(request));
    }
    return isInitial(body);
  }
}

// Create server instance
const mcpServer = new MCPServer(
  new Server(
    {
      name: 'Ayaan MCP Server',
      version: '0.0.1',
    },
    {
      capabilities: {
        tools: {},
        logging: {},
      },
    }
  )
);

// Express app setup
const app = express();
app.use(express.json());

const router = express.Router();
const MCP_ENDPOINT = '/mcp';

// POST endpoint for handling MCP requests
router.post(MCP_ENDPOINT, async (req: Request, res: Response) => {
  await mcpServer.handlePostRequest(req, res);
});

// GET endpoint for SSE streams
router.get(MCP_ENDPOINT, async (req: Request, res: Response) => {
  await mcpServer.handleGetRequest(req, res);
});

app.use('/', router);

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`MCP Streamable HTTP Server listening on port ${PORT}`);
  console.log(
    `MCP endpoint available at: http://localhost:${PORT}${MCP_ENDPOINT}`
  );
});
