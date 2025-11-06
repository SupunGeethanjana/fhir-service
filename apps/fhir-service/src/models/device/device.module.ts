import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CoreModule } from '../../core/core.module';
import { DeviceController } from './device.controller';
import { DeviceService } from './device.service';
import { DeviceHistory } from './entities/device-history.entity';
import { Device } from './entities/device.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Device, DeviceHistory]),
        forwardRef(() => CoreModule)
    ],
    controllers: [DeviceController],
    providers: [DeviceService],
    exports: [DeviceService],
})
export class DeviceModule { }
