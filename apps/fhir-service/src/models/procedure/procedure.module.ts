import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { ProcedureHistory } from './entities/procedure-history.entity';
import { Procedure } from './entities/procedure.entity';
import { ProcedureController } from './procedure.controller';
import { ProcedureService } from './procedure.service';
@Module({
  imports: [TypeOrmModule.forFeature([Procedure, ProcedureHistory]), forwardRef(() => CoreModule)],
  controllers: [ProcedureController],
  providers: [ProcedureService],
  exports: [ProcedureService],
})
export class ProcedureModule {}