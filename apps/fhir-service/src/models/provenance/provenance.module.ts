import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { ProvenanceHistory } from './entities/provenance-history.entity';
import { Provenance } from './entities/provenance.entity';
import { ProvenanceController } from './provenance.controller';
import { ProvenanceService } from './provenance.service';

@Module({
    imports: [TypeOrmModule.forFeature([Provenance, ProvenanceHistory]), forwardRef(() => CoreModule)],
    controllers: [ProvenanceController],
    providers: [ProvenanceService],
    exports: [ProvenanceService],
})
export class ProvenanceModule { }
