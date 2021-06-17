from unittest import TestCase

import pytest
from helpers import *

from pytezos import ContractInterface, pytezos, MichelsonRuntimeError
from pytezos.context.mixin import ExecutionContext

pair = {
    "token_a_address" : "KT1PgHxzUXruWG5XAahQzJAjkk4c2sPcM3Ca",
    "token_a_id" : 0,
    "token_b_address" : "KT1Wz32jY2WEwWq8ZaA2C6cYFHGchFYVVczC",
    "token_b_id" : 255,
    "standard": "fa12"
}

class TokenToTokenTest(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

        dex_code = open("./integration_tests/MockTTDex.tz", 'r').read()
        cls.dex = ContractInterface.from_michelson(dex_code)
    
    # TODO check triangle abritrage
    def test_tt_token_to_token_router(self):
        token_a = "KT1PgHxzUXruWG5XAahQzJAjkk4c2sPcM3Ca"
        token_b = "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton"
        token_c = "KT1Wz32jY2WEwWq8ZaA2C6cYFHGchFYVVczC"

        pair_ab = {
            "token_a_address" : token_a,
            "token_a_id" : 0,
            "token_b_address" : token_b,
            "token_b_id" : 1,
            "standard": "fa2"
        }
        pair_bc = {
            "token_a_address" : token_b,
            "token_a_id" : 1,
            "token_b_address" : token_c,
            "token_b_id" : 2,
            "standard": "fa12"
        }

        amount_in=10_000

        chain = LocalChain(token_to_token=True)
        res = chain.execute(self.dex.initializeExchange(pair_ab, 100_000, 300_000))
        res = chain.execute(self.dex.initializeExchange(pair_bc, 500_000, 700_000))

        # interpret the call without applying it
        res = chain.interpret(self.dex.tokenToTokenRoutePayment({
            "swaps" : [
                {
                    "pair": pair_ab, 
                    "operation": "sell",
                },
                {
                    "pair": pair_bc, 
                    "operation": "sell",
                }
            ],
            "amount_in" : amount_in,
            "min_amount_out" : 1, 
            "receiver" : julian
        }))

        transfers = parse_token_transfers(res)

        contract_in = next(v for v in transfers if v["destination"] == contract_self_address)
        self.assertEqual(contract_in["token_address"], token_a)
        self.assertEqual(contract_in["amount"], 10_000)

        routed_out = next(v for v in transfers if v["destination"] == julian)
        self.assertEqual(routed_out["token_address"], token_c)

        # same swap but one by one
        res = chain.interpret(self.dex.tokenToTokenPayment(
            pair=pair_ab,
            operation="sell",
            amount_in=amount_in,
            min_amount_out=1,
            receiver=julian
        ))
        transfers = parse_token_transfers(res)
        first_out = next(v for v in transfers if v["destination"] == julian)

        res = chain.interpret(self.dex.tokenToTokenPayment(
            pair=pair_bc,
            operation="sell",
            amount_in=first_out["amount"],
            min_amount_out=1,
            receiver=julian
        ))
        transfers = parse_token_transfers(res)
        second_out = next(v for v in transfers if v["destination"] == julian)

        self.assertEqual(routed_out["amount"], first_out["amount"] + second_out["amount"])

    
    def test_tt_router_equals_to_usual(self):
        chain = LocalChain(token_to_token=True)
        res = chain.execute(self.dex.initializeExchange(pair, 1_000, 3_000_000))
        
        amount_in=1_000_000

        res = chain.interpret(self.dex.tokenToTokenPayment(pair=pair, operation="buy", amount_in=amount_in, min_amount_out=1, receiver=julian))
        non_routed_transfers = parse_token_transfers(res)

        # interpret router payment
        res = chain.interpret(self.dex.tokenToTokenRoutePayment({
            "swaps" : [
                {
                    "pair": pair, 
                    "operation": "buy",
                }
            ],
            "amount_in" : amount_in,
            "min_amount_out" : 1, 
            "receiver" : julian
        }))
        through_router_transfers = parse_token_transfers(res)

        self.assertDictEqual(non_routed_transfers, through_router_transfers)

    def test_tt_router_impossible_path(self):
        token_a = "KT1PgHxzUXruWG5XAahQzJAjkk4c2sPcM3Ca"
        token_b = "KT1RJ6PbjHpwc3M5rw5s2Nbmefwbuwbdxton"
        token_c = "KT1AxaBxkFLCUi3f8rdDAAxBKHfzY8LfKDRA"
        token_d = "KT1Wz32jY2WEwWq8ZaA2C6cYFHGchFYVVczC"

        pair_ab = {
            "token_a_address" : token_a,
            "token_a_id" : 0,
            "token_b_address" : token_b,
            "token_b_id" : 1,
            "standard": "fa2"
        }
        pair_cd = {
            "token_a_address" : token_c,
            "token_a_id" : 1,
            "token_b_address" : token_d,
            "token_b_id" : 2,
            "standard": "fa12"
        }

        chain = LocalChain(token_to_token=True)
        res = chain.execute(self.dex.initializeExchange(pair_ab, 1111, 3333))
        res = chain.execute(self.dex.initializeExchange(pair_cd, 5555, 7777))

        # can't find path
        with self.assertRaises(MichelsonRuntimeError):
            res = chain.interpret(self.dex.tokenToTokenRoutePayment({
                "swaps" : [
                    {
                        "pair": pair_ab, 
                        "operation": "sell",
                    },
                    {
                        "pair": pair_cd, 
                        "operation": "sell",
                    }
                ],
                "amount_in" : 334,
                "min_amount_out" : 1, 
                "receiver" : julian
            }))