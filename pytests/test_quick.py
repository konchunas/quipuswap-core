from os.path import dirname, join
from unittest import TestCase
from decimal import Decimal

from helpers import *

from pytezos import ContractInterface, pytezos, MichelsonRuntimeError
from pytezos.context.mixin import ExecutionContext

class DexTest(TestCase):

    @classmethod
    def setUpClass(cls):
        cls.maxDiff = None

        dex_code = open("./MockDex.tz", 'r').read()
        cls.dex = ContractInterface.from_michelson(dex_code)

    def test_initialize(self):
        res = self.dex.initializeExchange(100).interpret(amount=10)
        storage = res.storage["storage"]
        self.assertEqual(storage["token_pool"], 100)
        self.assertEqual(storage["tez_pool"], 10)
        self.assertEqual(storage["invariant"], 1000)

        # res = self.dex.investLiquidity(30).interpret(amount=20, storage=res.storage)
        # res = self.dex.tezToTokenPayment(2, my_address).interpret(amount=1, storage=res.storage)
        # print(res.storage)
        # print(res.operations)

        # res = self.dex.investLiquidity(2, my_address).interpret(amount=1, storage=res.storage)

        # res = self.my.default('bar').interpret(storage='foo')
        # self.assertEqual('foobar', res.storage)

    def test_fail_initialize(self):
        with self.assertRaises(MichelsonRuntimeError):
            res = self.dex.initializeExchange(100).interpret(amount=0)
        
        with self.assertRaises(MichelsonRuntimeError):
            res = self.dex.initializeExchange(0).interpret(amount=1)

    def test_fail_invest_not_init(self):
        with self.assertRaises(MichelsonRuntimeError):
            res = self.dex.investLiquidity(30).interpret(amount=1)

    def test_fail_divest_not_init(self):
        with self.assertRaises(MichelsonRuntimeError):
            res = self.dex.divestLiquidity(10, 20, 30).interpret(amount=1)

    def test_swap_not_init(self):
        with self.assertRaises(MichelsonRuntimeError):
            res = self.dex.tokenToTezPayment(amount=10, min_out=20, receiver="tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw").interpret(amount=1)
        
        with self.assertRaises(MichelsonRuntimeError):
            res = self.dex.tezToTokenPayment(10, "tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw").interpret(amount=1)

    def test_reward_payment(self):
        my_address = self.dex.context.get_sender()
        chain = LocalChain()
        res = chain.execute(self.dex.initializeExchange(100000), amount=100)
        storage = res.storage["storage"]

        res = chain.execute(self.dex.default(), amount=12)
        chain.advance_time()

        res = chain.execute(self.dex.withdrawProfit(my_address), amount=0)
        print(res.operations)
        (_, firstProfit) = parse_tez_transfer(res)

        chain.advance_time()

        res = chain.execute(self.dex.withdrawProfit(my_address), amount=0)
        print(res.operations)
        (_, secondProfit) = parse_tez_transfer(res)

        # print("balance expr", self.dex.context.get_amount_expr())

        # TODO it is actually super close to 12
        self.assertEqual(firstProfit+secondProfit, 11)

        print(chain.storage)

    def test_divest_everything(self):
        chain = LocalChain()
        res = chain.execute(self.dex.initializeExchange(100000), amount=100000)

        res = chain.execute(self.dex.divestLiquidity(min_tez=100000, min_tokens=100000, shares=100000), amount=0)

        print(res.operations)

    def test_divest_everything(self):
        chain = LocalChain()
        res = chain.execute(self.dex.initializeExchange(100000), amount=100000)

        res = chain.execute(self.dex.divestLiquidity(min_tez=100000, min_tokens=100000, shares=100000), amount=0)

        print(res.operations)
        ops = parse_ops(res)
        print(ops)
        # param = parse_token_transfer(res)
        # print(param)

        # self.assertEqual(

    