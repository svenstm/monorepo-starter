import { Test, TestingModule } from '@nestjs/testing';
import { HasherModule } from './hasher.module';
import { HasherService } from './hasher.service';
import { beforeEach, describe, expect, it } from 'vitest';

describe('HasherService', () => {
  let service: HasherService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HasherModule],
    }).compile();

    service = module.get<HasherService>(HasherService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
