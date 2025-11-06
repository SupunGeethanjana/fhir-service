import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { CoverageController } from './coverage.controller';
import { CoverageService } from './coverage.service';
import { CoverageHistory } from './entities/coverage-history.entity';
import { Coverage } from './entities/coverage.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Coverage, CoverageHistory]), forwardRef(() => CoreModule)],
    controllers: [CoverageController],
    providers: [CoverageService],
    exports: [CoverageService],
})
export class CoverageModule { }
