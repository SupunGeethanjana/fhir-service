import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { LocationHistory } from './entities/location-history.entity';
import { Location } from './entities/location.entity';
import { LocationController } from './location.controller';
import { LocationService } from './location.service';

/** The NestJS module for the Location resource. */
@Module({
    imports: [TypeOrmModule.forFeature([Location, LocationHistory]), forwardRef(() => CoreModule)],
    controllers: [LocationController],
    providers: [LocationService],
    exports: [LocationService],
})
export class LocationModule { }
