import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Controller('user')
@UseGuards(AuthGuard('jwt'))
export class UserController {
  @Get()
  async getProfile(@Req() req: Request) {
    return req.user;
  }
}
