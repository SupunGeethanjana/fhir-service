import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { CarePlanService } from './care-plan.service';
import { CarePlanHistory } from './entities/care-plan-history.entity';
import { CarePlan } from './entities/care-plan.entity';

/**
 * Concrete controller for the CarePlan resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('CarePlan') and @Controller('CarePlan') decorator sets the base path for all routes
 * in this controller to `/CarePlan`.
 * 
 * CarePlan resources describe the intention of how one or more practitioners
 * intend to deliver care for a particular patient, group, or community for a
 * period of time, possibly limited to care for a specific condition or set of conditions.
 * 
 * This controller provides RESTful endpoints for:
 * - Creating new care plans
 * - Retrieving care plans by ID
 * - Updating existing care plans
 * - Searching care plans by various parameters
 * - Managing care plan versions and history
 * - Supporting care coordination workflows
 * 
 * Common search parameters include:
 * - subject: Patient reference
 * - status: active, completed, draft, etc.
 * - intent: plan, order, option, etc.
 * - category: Care plan category codes
 * - date: Care plan creation/authorization date
 * - encounter: Associated encounter reference
 * - performer: Care team member references
 * 
 * @example
 * ```
 * GET /CarePlan?subject=Patient/123&status=active
 * POST /CarePlan
 * PUT /CarePlan/456
 * PATCH /CarePlan/456
 * ```
 */
@ApiTags('CarePlan')
@Controller('CarePlan')
export class CarePlanController extends GenericFhirController<CarePlan, CarePlanHistory> {
    constructor(private readonly carePlanService: CarePlanService) {
        // Pass the injected service to the parent controller's constructor.
        super(carePlanService);
    }
}
