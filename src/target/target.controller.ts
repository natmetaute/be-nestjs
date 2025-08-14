import {
  Controller,
  Get,
  Body,
  Post,
  Put,
  Delete,
  Param,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { TargetService } from './target.service';
import { Target } from './target.entity';
import { CreateTargetDto } from './dto/create-target.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

interface RowValidationError {
  row: number;
  errors: Record<string, string>;
}

export async function validateTargets(
  rows: unknown[],
  companyId: number,
): Promise<{ valid: CreateTargetDto[]; errors: RowValidationError[] }> {
  const valid: CreateTargetDto[] = [];
  const errors: RowValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const raw = rows[i] as Record<string, any>;

    const targetObj = {
      ...raw,
      amount: raw.amount !== undefined ? Number(raw.amount) : undefined,
      year: raw.year !== undefined ? Number(raw.year) : undefined,
      month: raw.month !== undefined ? Number(raw.month) : undefined,
      quarter: raw.quarter !== undefined ? Number(raw.quarter) : undefined,
      companyId: Number(companyId),
    };

    const target = plainToInstance(CreateTargetDto, targetObj, {
      excludeExtraneousValues: true,
      enableImplicitConversion: true,
    });

    target.companyId = companyId;

    const rowErrors = await validate(target, {
      whitelist: true,
      forbidNonWhitelisted: false,
    });

    if (rowErrors.length > 0) {
      errors.push({
        row: i + 1,
        errors: rowErrors.reduce(
          (acc, err) => {
            Object.entries(err.constraints || {}).forEach(
              ([field, message]) => {
                acc[err.property] = message; // key is the field name
              },
            );
            return acc;
          },
          {} as Record<string, string>,
        ),
      });
    } else {
      valid.push(target);
    }
  }

  return { valid, errors };
}

@Controller('targets')
export class TargetController {
  constructor(private readonly service: TargetService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const target = await this.service.findById(+id);
    if (!target) {
      throw new NotFoundException(`Target with ID ${id} not found`);
    }
    return target;
  }

  @Post()
  create(@Body() data: Partial<Target>) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Target>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(+id);
  }

  @Post('upload/:companyId')
  async uploadTargets(
    @Param('companyId') companyId: number,
    @Body() targets: CreateTargetDto[],
  ) {
    const { errors, valid } = await validateTargets(targets, companyId);

    if (errors.length > 0) {
      throw new BadRequestException({
        message: 'Validation failed',
        errors,
      });
    }

    const startTime = Date.now();
    const summary = await this.service.createOrUpdateTargets(valid, companyId);
    const endTime = Date.now();

    return {
      message: 'Targets processed successfully',
      insertedCount: summary.insertedCount,
      updatedCount: summary.updatedCount,
      updatedRecords: summary.updatedRecords,
      timeMs: endTime - startTime,
    };
  }
}
