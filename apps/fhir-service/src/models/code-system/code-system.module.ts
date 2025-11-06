import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { CodeSystemController } from './code-system.controller';
import { CodeSystemService } from './code-system.service';
import { CodeSystemHistory } from './entities/code-system-history.entity';
import { CodeSystem } from './entities/code-system.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CodeSystem, CodeSystemHistory]), forwardRef(() => CoreModule)],
    controllers: [CodeSystemController],
    providers: [CodeSystemService],
    exports: [CodeSystemService],
})
export class CodeSystemModule { }
