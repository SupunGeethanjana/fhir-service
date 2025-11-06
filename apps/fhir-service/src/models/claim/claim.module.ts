import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { ClaimController } from './claim.controller';
import { ClaimService } from './claim.service';
import { ClaimHistory } from './entities/claim-history.entity';
import { Claim } from './entities/claim.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Claim, ClaimHistory]), forwardRef(() => CoreModule)],
    controllers: [ClaimController],
    providers: [ClaimService],
    exports: [ClaimService],
})
export class ClaimModule { }
