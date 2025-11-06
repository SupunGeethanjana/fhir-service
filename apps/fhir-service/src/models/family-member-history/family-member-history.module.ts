import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { FamilyMemberHistoryHistory } from './entities/family-member-history-history.entity';
import { FamilyMemberHistory } from './entities/family-member-history.entity';
import { FamilyMemberHistoryController } from './family-member-history.controller';
import { FamilyMemberHistoryService } from './family-member-history.service';
// ...
@Module({
  imports: [TypeOrmModule.forFeature([FamilyMemberHistory, FamilyMemberHistoryHistory]), forwardRef(() => CoreModule)],
  controllers: [FamilyMemberHistoryController],
  providers: [FamilyMemberHistoryService],
  exports: [FamilyMemberHistoryService],
})
export class FamilyMemberHistoryModule {}