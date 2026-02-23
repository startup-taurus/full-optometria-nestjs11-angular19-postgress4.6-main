import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const BranchContext = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const branchId = request.branchId;

    return branchId;
  }
);
