import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AiModule } from './ai/ai.module';
import { SchedulingModule } from './scheduling/scheduling.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url:
        process.env.DATABASE_URL ??
        'postgres://postgres:postgres@localhost:5432/office_hours',
      
      ssl:
        process.env.DATABASE_SSL === 'true'
          ? { rejectUnauthorized: false }
          : false,
      autoLoadEntities: true,
      
      synchronize: true,
    }),
    AiModule,
    SchedulingModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
