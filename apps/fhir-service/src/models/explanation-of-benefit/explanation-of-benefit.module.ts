import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { ExplanationOfBenefitHistory } from './entities/explanation-of-benefit-history.entity';
import { ExplanationOfBenefit } from './entities/explanation-of-benefit.entity';
import { ExplanationOfBenefitController } from './explanation-of-benefit.controller';
import { ExplanationOfBenefitService } from './explanation-of-benefit.service';

@Module({
    imports: [TypeOrmModule.forFeature([ExplanationOfBenefit, ExplanationOfBenefitHistory]), forwardRef(() => CoreModule)],
    controllers: [ExplanationOfBenefitController],
    providers: [ExplanationOfBenefitService],
    exports: [ExplanationOfBenefitService],
})
export class ExplanationOfBenefitModule { }
