import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { GenericFhirController } from '../../fhir-generics/generic-fhir.controller';
import { DeviceService } from './device.service';
import { DeviceHistory } from './entities/device-history.entity';
import { Device } from './entities/device.entity';

/**
 * Concrete controller for the Device resource.
 * 
 * It extends the GenericFhirController and requires no additional code
 * to get a full API surface for CRUD + Search operations.
 * The @ApiTags('Device') and @Controller('Device') decorator sets the base path for all routes
 * in this controller to `/Device`.
 */
@ApiTags('Device')
@Controller('Device')
export class DeviceController extends GenericFhirController<Device, DeviceHistory> {
    constructor(private readonly deviceService: DeviceService) {
        // Pass the injected service to the parent controller's constructor.
        super(deviceService);
    }
}
