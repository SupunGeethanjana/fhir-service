import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { CareTeamController } from './care-team.controller';
import { CareTeamService } from './care-team.service';
import { CareTeamHistory } from './entities/care-team-history.entity';
import { CareTeam } from './entities/care-team.entity';

@Module({
    imports: [TypeOrmModule.forFeature([CareTeam, CareTeamHistory]), forwardRef(() => CoreModule)],
    controllers: [CareTeamController],
    providers: [CareTeamService],
    exports: [CareTeamService],
})
export class CareTeamModule { }
