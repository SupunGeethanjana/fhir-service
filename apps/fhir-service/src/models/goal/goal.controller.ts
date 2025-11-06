import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { GoalHistory } from './entities/goal-history.entity';
import { Goal } from './entities/goal.entity';
import { GoalService } from './goal.service';

@ApiTags('Goal')
@Controller('Goal')
export class GoalController extends GenericFhirController<Goal, GoalHistory> {
    constructor(private readonly goalService: GoalService) {
        super(goalService);
    }
}
