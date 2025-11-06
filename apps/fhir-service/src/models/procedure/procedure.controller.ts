import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ProcedureService } from './procedure.service';
import { Procedure } from './entities/procedure.entity';
import { ProcedureHistory } from './entities/procedure-history.entity';

/**
 * Concrete controller for the Procedure resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Procedure')
@Controller('Procedure') decorator sets the base path for all routes
 * in this controller to `/Procedure`.
 */
@ApiTags('Procedure')
@Controller('Procedure')
export class ProcedureController extends GenericFhirController<Procedure, ProcedureHistory> {
  constructor(private readonly procedureService: ProcedureService) {
    // Pass the injected service to the parent controller's constructor.
    super(procedureService);
  }
}