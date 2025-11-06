import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { SpecimenHistory } from './entities/specimen-history.entity';
import { Specimen } from './entities/specimen.entity';
import { SpecimenController } from './specimen.controller';
import { SpecimenService } from './specimen.service';

@Module({
    imports: [
        TypeOrmModule.forFeature([Specimen, SpecimenHistory]),
        forwardRef(() => CoreModule)
    ],
    controllers: [SpecimenController],
    providers: [SpecimenService],
    exports: [SpecimenService],
})
export class SpecimenModule { }
