import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersController {
    private usersService;
    constructor(usersService: UsersService);
    getUser(id: string): Promise<import("../entities").User>;
    updateUser(id: string, updateUserDto: UpdateUserDto, req: any): Promise<import("../entities").User>;
}
