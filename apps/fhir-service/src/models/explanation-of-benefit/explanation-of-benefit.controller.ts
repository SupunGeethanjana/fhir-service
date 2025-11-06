import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { ExplanationOfBenefitHistory } from './entities/explanation-of-benefit-history.entity';
import { ExplanationOfBenefit } from './entities/explanation-of-benefit.entity';
import { ExplanationOfBenefitService } from './explanation-of-benefit.service';

@ApiTags('ExplanationOfBenefit')
@Controller('ExplanationOfBenefit')
export class ExplanationOfBenefitController extends GenericFhirController<ExplanationOfBenefit, ExplanationOfBenefitHistory> {
    constructor(private readonly explanationOfBenefitService: ExplanationOfBenefitService) {
        super(explanationOfBenefitService);
    }
}
