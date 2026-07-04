import { Controller, Get, Post, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { DepositDto, TransferDto } from '../wallet/dto/wallet.dto';
import { ListTransactionsQueryDto } from './dto/list-transactions.query.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, JwtPayload } from '../common/decorators/current-user.decorator';

@ApiTags('transactions')
@Controller('transactions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  @ApiOperation({ summary: 'List user transactions (paginated)' })
  list(@CurrentUser() user: JwtPayload, @Query() query: ListTransactionsQueryDto) {
    return this.transactionsService.listByUser(user.sub, query.page, query.take, {
      search: query.search,
      startDate: query.startDate,
      endDate: query.endDate,
    });
  }

  @Post('deposit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Deposit money into own wallet' })
  deposit(@CurrentUser() user: JwtPayload, @Body() dto: DepositDto) {
    return this.transactionsService.deposit(user.sub, dto);
  }

  @Post('transfer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Transfer money to another user' })
  transfer(@CurrentUser() user: JwtPayload, @Body() dto: TransferDto) {
    return this.transactionsService.transfer(user.sub, dto);
  }

  @Post(':id/reverse')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reverse a completed transaction' })
  reverse(@CurrentUser() user: JwtPayload, @Param('id') id: string) {
    return this.transactionsService.reverse(user.sub, id);
  }
}
