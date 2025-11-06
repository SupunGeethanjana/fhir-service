import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { FamilyMemberHistoryService } from './family-member-history.service';
import { FamilyMemberHistory } from './entities/family-member-history.entity';
import { FamilyMemberHistoryHistory } from './entities/family-member-history-history.entity';

/**
 * Concrete controller for the FamilyMemberHistory resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('FamilyMemberHistory')
@Controller('FamilyMemberHistory') decorator sets the base path for all routes
 * in this controller to `/FamilyMemberHistory`.
 */
@ApiTags('FamilyMemberHistory')
@Controller('FamilyMemberHistory')
export class FamilyMemberHistoryController extends GenericFhirController<FamilyMemberHistory, FamilyMemberHistoryHistory> {
  constructor(private readonly familyMemberHistoryService: FamilyMemberHistoryService) {
    // Pass the injected service to the parent controller's constructor.
    super(familyMemberHistoryService);
  }
}