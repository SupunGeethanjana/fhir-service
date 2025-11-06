import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { ValueSetHistory } from './entities/value-set-history.entity';
import { ValueSet } from './entities/value-set.entity';
import { ValueSetController } from './value-set.controller';
import { ValueSetService } from './value-set.service';

@Module({
    imports: [TypeOrmModule.forFeature([ValueSet, ValueSetHistory]), forwardRef(() => CoreModule)],
    controllers: [ValueSetController],
    providers: [ValueSetService],
    exports: [ValueSetService],
})
export class ValueSetModule { }
