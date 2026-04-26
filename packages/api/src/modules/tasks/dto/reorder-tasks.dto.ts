import { IsArray, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class TaskOrderItem {
  @ApiProperty()
  @IsNumber()
  id: number;

  @ApiProperty()
  @IsNumber()
  order: number;
}

export class ReorderTasksDto {
  @ApiProperty({ type: [TaskOrderItem] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskOrderItem)
  tasks: TaskOrderItem[];
}
