import { CustomScalar, Scalar } from '@nestjs/graphql';
import { Kind, ValueNode } from 'graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

/**
 * Custom GraphQL scalar for arbitrary JSON objects, used for FHIR resource payloads.
 *
 * This scalar allows GraphQL input/output fields to accept any valid JSON object,
 * enabling support for dynamic FHIR resource structures in GraphQL APIs.
 *
 * Usage: Annotate fields with @Field(() => GraphQLJSONObject) in input/output types.
 *
 * Registered as 'GraphQLJSONObject' in the GraphQL schema.
 */
@Scalar('GraphQLJSONObject', () => GraphQLJSONObject)
export class GraphQLJSONObjectScalar implements CustomScalar<any, any> {
    /**
     * Description for GraphQL schema introspection.
     */
    description = 'GraphQL JSONObject custom scalar type';

    /**
     * Called when the value is received from the client (input variable).
     * Returns the value as-is for further processing.
     * @param value - The input value from the client
     */
    parseValue(value: any): any {
        return value;
    }

    /**
     * Called when the value is sent to the client (output field).
     * Returns the value as-is for serialization.
     * @param value - The value to be sent to the client
     */
    serialize(value: any): any {
        return value;
    }

    /**
     * Called when the value is provided inline in a GraphQL query (not as a variable).
     * Only supports object AST nodes; returns null for other types.
     * @param ast - The GraphQL AST node
     */
    parseLiteral(ast: ValueNode): any {
        switch (ast.kind) {
            case Kind.OBJECT:
                return ast;
            default:
                return null;
        }
    }
}
