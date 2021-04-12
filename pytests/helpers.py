
from pytezos import pytezos 

fee_rate = 333
voting_period = 2592000

initial_storage = dict(
    token_id = 0,
    tez_pool = 0,
    token_pool = 0,
    invariant = 0,
    total_supply = 0,
    token_address = "tz1irF8HUsQp2dLhKNMhteG1qALNU9g3pfdN",
    ledger = {},
    voters = {},
    vetos = {},
    votes = {},
    veto = 0,
    last_veto = pytezos.now(),
    current_delegated = None,
    current_candidate = None,
    total_votes = 0,
    total_reward = 0,
    reward_paid = 0,
    reward = 0,
    reward_per_share = 0,
    last_update_time = pytezos.now(),
    period_finish = pytezos.now(),
    reward_per_sec = 0,
    user_rewards = {},
)

initial_full_storage = {
    'dex_lambdas': {}, 'metadata': {}, 'token_lambdas': {}, 'storage': initial_storage
}

def print_pool_stats(res):
    print("\n")
    print("token_pool:", res.storage["storage"]["token_pool"])
    print("tez_pool", res.storage["storage"]["tez_pool"])
    print("invariant", res.storage["storage"]["invariant"])

def calc_tokens_out(res, tez_amount):
    token_pool = res.storage["storage"]["token_pool"]
    tez_pool = res.storage["storage"]["tez_pool"]
    invariant = res.storage["storage"]["invariant"]
    tez_pool = tez_pool + tez_amount

    new_token_pool = invariant / abs(tez_pool - tez_amount / fee_rate)
    tokens_out = abs(token_pool - new_token_pool)
    return tokens_out

def calc_tez_out(res, token_amount):
    token_pool = res.storage["storage"]["token_pool"]
    tez_pool = res.storage["storage"]["tez_pool"]
    invariant = res.storage["storage"]["invariant"]
    
    token_pool = token_pool + token_amount
    new_tez_pool = invariant / abs(token_pool - token_amount / fee_rate)
    tez_out = abs(tez_pool - new_tez_pool)
    return tez_out

def parse_tez_transfer(op):
    dest = op["destination"]
    amount = int(op["amount"])
    return {
        "type": "tez", 
        "destination": dest,
        "amount": amount
    }

def parse_token_transfer(op):
    value = op["parameters"]["value"][0]
    args = value["args"][1][0]["args"]
    
    amount = args[-1]["int"]
    amount = int(amount)
   
    dest = args[0]["string"]
   
    return {
        "type": "token", 
        "destination": dest,
        "amount": amount
    }

def parse_ops(res):
    result = []
    for op in res.operations:
        if op["kind"] == "transaction":
            if op["parameters"]["entrypoint"] == "default":
                tx = parse_tez_transfer(op)
                result.append(tx)
            else:
                tx = parse_token_transfer(op)
                result.append(tx)

    return result



class LocalChain():
    balance = 0
    storage = initial_full_storage
    now = pytezos.now()
    def execute(self, call, amount):
        self.balance += amount
        res = call.interpret(amount=amount, storage=self.storage, balance=self.balance, now=self.now)
        self.storage = res.storage
        return res

    def advance_time(self):
        self.now += voting_period // 2 + 1

# def init_storage_from_factory():
#     factory_code = open("./FactoryFA2.tz", 'r').read()
#     factory = ContractInterface.from_michelson(factory_code)
#     res = factory.launchExchange(("KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton", 0), 100).interpret(amount=1, balance=1)

#     # TODO find how to parse micheline storage
#     storage_expression = res.operations[0]["script"]["storage"]
#     return storage_expression