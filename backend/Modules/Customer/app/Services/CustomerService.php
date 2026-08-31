<?php
namespace Modules\Customer\Services;
use Modules\Customer\Models\Customer;
use Illuminate\Database\Eloquent\Collection;

class CustomerService
{
    public function getAll(): Collection
    {
        return Customer::with('user')->get();
    }

    public function create(array $data): Customer
    {
        return Customer::create($data);
    }

    public function update(Customer $customer, array $data): Customer
    {
        $customer->update($data);
        return $customer;
    }

    public function delete(Customer $customer): bool
    {
        return Customer::destroy($customer->id);
    }
}