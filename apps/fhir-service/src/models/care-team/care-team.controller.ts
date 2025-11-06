import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { CareTeamService } from './care-team.service';
import { CareTeamHistory } from './entities/care-team-history.entity';
import { CareTeam } from './entities/care-team.entity';

@ApiTags('CareTeam')
@Controller('CareTeam')
export class CareTeamController extends GenericFhirController<CareTeam, CareTeamHistory> {
    constructor(private readonly careTeamService: CareTeamService) {
        super(careTeamService);
    }
}
