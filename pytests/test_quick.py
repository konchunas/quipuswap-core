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

        # TODO it is actually super close to 12
        self.assertEqual(firstProfit+secondProfit, 11)

        print(chain.storage)

    def test_divest_everything(self):
        chain = LocalChain()
        res = chain.execute(self.dex.initializeExchange(100_000), amount=100_000)

        res = chain.execute(self.dex.divestLiquidity(min_tez=100_000, min_tokens=100_000, shares=100_000), amount=0)

        ops = parse_ops(res)

        self.assertEqual(ops[0]["type"], "token")
        self.assertEqual(ops[0]["amount"], 100_000)

        self.assertEqual(ops[1]["type"], "tez")
        self.assertEqual(ops[1]["amount"], 100_000)

    def test_divest_amount_after_swap(self):
        chain = LocalChain()
        res = chain.execute(self.dex.initializeExchange(100_000), amount=100_000)

        # swap tokens to tezos
        res = chain.execute(self.dex.tokenToTezPayment(amount=10_000, min_out=1, receiver="tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw"), amount=0)
        
        ops = parse_ops(res)
        tez_received = ops[1]["amount"]

        # swap the received tezos back to tokens
        res = chain.execute(self.dex.tezToTokenPayment(min_out=1, receiver="tz1MDhGTfMQjtMYFXeasKzRWzkQKPtXEkSEw"), amount=tez_received)

        # take all the funds out
        res = chain.execute(self.dex.divestLiquidity(min_tez=100_000, min_tokens=100_000, shares=100_000), amount=0)

        ops = parse_ops(res)

        self.assertEqual(ops[0]["type"], "token")
        self.assertGreater(ops[0]["amount"], 100_000) # ensure greates cause it should include some fee

        self.assertEqual(ops[1]["type"], "tez")
        self.assertGreaterEqual(ops[1]["amount"], 100_000)

