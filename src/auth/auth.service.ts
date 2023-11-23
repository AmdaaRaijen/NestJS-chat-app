import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  createUserName(name: string) {
    return (
      name.toLowerCase().replace(/\s/g, '') + Math.floor(Math.random() * 1000)
    );
  }

  hashPassword(password: string) {
    return bcrypt.hashSync(password, 10);
  }

  async register(registerDto: RegisterDto) {
    const emailExists = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (registerDto.username) {
      const usernameExists = await this.prisma.user.findUnique({
        where: { username: registerDto.username },
      });

      if (usernameExists) {
        throw new BadRequestException('Username already exists');
      }
    }

    if (emailExists) {
      throw new BadRequestException('Email already exists');
    }

    if (!registerDto.username) {
      registerDto.username = this.createUserName(registerDto.name);
    }

    registerDto.password = this.hashPassword(registerDto.password);

    const user = await this.prisma.user.create({
      data: {
        ...registerDto,
        username: registerDto.username,
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
    });

    if (!user) {
      throw new BadRequestException('Username does not exist');
    }

    const passwordMatch = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
