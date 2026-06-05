import { PartialType } from '@nestjs/swagger';
import { CreateProjectDto } from './create-project.dto';

// UpdateProjectDto inherits every field from CreateProjectDto (including
// the new `status` enum) as optional via PartialType. The legacy `archived`
// bool is gone — set `status: 'archived'` instead.
export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
