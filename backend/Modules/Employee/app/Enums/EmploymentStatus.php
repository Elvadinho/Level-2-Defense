<?php

namespace Modules\Employee\Enums;

enum EmploymentStatus: string
{
    case ACTIVE = 'active';
    case ON_LEAVE = 'on_leave';
    case TERMINATED = 'terminated';

    public function label():string
    {
        return match ($this){
            self::ACTIVE => 'Active',
            self::ON_LEAVE => 'On Leave',
            self::TERMINATED => 'Terminated',
        };
    }
}
