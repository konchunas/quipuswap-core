import { Context } from "./contracManagers/context";
import { strictEqual, ok, notStrictEqual, rejects } from "assert";
import BigNumber from "bignumber.js";

contract("Veto()", function () {
  let context: Context;

  before(async () => {
    context = await Context.init([]);
  });

  it("should add veto and set none delegator", async function () {
    this.timeout(5000000);
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // get gelegate address
    await context.updateActor("bob");
    let carolAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    let delegate = carolAddress;
    let value = 500;
    let reward = 1000;

    // vote for the candidate
    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.pairs[0].vote(aliceAddress, delegate, value);

    // update delegator
    await context.pairs[0].sendReward(reward);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegator not set"
    );

    // store prev balances
    let aliceInitVoteInfo = context.pairs[0].storage.voters[aliceAddress] || {
      candidate: undefined,
      vote: new BigNumber(0),
      veto: new BigNumber(0),
      last_veto: 0,
    };
    let aliceInitSharesInfo = context.pairs[0].storage.ledger[aliceAddress] || {
      balance: new BigNumber(0),
      frozen_balance: new BigNumber(0),
      allowances: {},
    };
    let aliceInitCandidateVeto =
      context.pairs[0].storage.vetos[delegate] || new BigNumber(0);

    // veto
    await context.pairs[0].veto(aliceAddress, value);

    // checks
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    let aliceFinalVoteInfo = context.pairs[0].storage.voters[aliceAddress] || {
      candidate: undefined,
      vote: new BigNumber(0),
      veto: new BigNumber(0),
      last_veto: 0,
    };
    let aliceFinalSharesInfo = context.pairs[0].storage.ledger[
      aliceAddress
    ] || {
      balance: new BigNumber(0),
      frozen_balance: new BigNumber(0),
      allowances: {},
    };
    let aliceFinalCandidateVeto =
      context.pairs[0].storage.vetos[delegate] || new BigNumber(0);
    let finalVetos = context.pairs[0].storage.veto;
    let finalCurrentDelegate = context.pairs[0].storage.current_delegated;
    // 1. tokens frozen
    strictEqual(
      aliceFinalSharesInfo.balance.toNumber(),
      aliceInitSharesInfo.balance.toNumber() - value,
      "Tokens not removed"
    );
    strictEqual(
      aliceFinalSharesInfo.frozen_balance.toNumber(),
      aliceInitSharesInfo.frozen_balance.toNumber() + value,
      "Tokens not frozen"
    );
    // 2. voter info updated
    notStrictEqual(
      aliceFinalVoteInfo.last_veto,
      aliceInitVoteInfo.last_veto,
      "User last veto time wasn't updated"
    );
    strictEqual(
      aliceFinalVoteInfo.veto.toNumber(),
      value,
      "User veto wasn't updated"
    );
    // 3. veto time set
    notStrictEqual(aliceFinalCandidateVeto, 0, "Delegate wasn't locked");

    // 4. global state updated
    strictEqual(0, finalVetos.toNumber(), "Total votes weren't updated");
    strictEqual(finalCurrentDelegate, null, "Delegate wasn't updated");
  });

  if (process.env.EXCHANGE_TOKEN_STANDARD === "FA12") {
    it("should set veto by approved user", async function () {
      this.timeout(5000000);
      // reset pairs
      await context.flushPairs();
      await context.createPairs();

      // get gelegate address
      await context.updateActor("bob");
      let carolAddress = await tezos.signer.publicKeyHash();
      await context.updateActor();
      let delegate = carolAddress;
      let value = 500;
      let reward = 1000;

      // vote for the candidate
      let aliceAddress = await tezos.signer.publicKeyHash();
      await context.pairs[0].vote(aliceAddress, delegate, value);

      // update delegator
      await context.pairs[0].sendReward(reward);
      await context.pairs[0].updateStorage({
        ledger: [aliceAddress],
        voters: [aliceAddress],
        vetos: [delegate],
      });
      strictEqual(
        context.pairs[0].storage.current_delegated,
        delegate,
        "Delegator not set"
      );

      // approve tokens
      await context.updateActor("bob");
      let bobAddress = await tezos.signer.publicKeyHash();
      await context.updateActor();
      await context.pairs[0].approve(bobAddress, value);
      await context.updateActor("bob");

      // store prev balances
      let aliceInitVoteInfo = context.pairs[0].storage.voters[aliceAddress] || {
        candidate: undefined,
        vote: new BigNumber(0),
        veto: new BigNumber(0),
        last_veto: 0,
      };
      let aliceInitSharesInfo = context.pairs[0].storage.ledger[
        aliceAddress
      ] || {
        balance: new BigNumber(0),
        frozen_balance: new BigNumber(0),
        allowances: {},
      };
      let aliceInitCandidateVeto =
        context.pairs[0].storage.vetos[delegate] || new BigNumber(0);

      // veto
      await context.pairs[0].veto(aliceAddress, value);

      // checks
      await context.pairs[0].updateStorage({
        ledger: [aliceAddress],
        voters: [aliceAddress],
        vetos: [delegate],
      });
      let aliceFinalVoteInfo = context.pairs[0].storage.voters[
        aliceAddress
      ] || {
        candidate: undefined,
        vote: new BigNumber(0),
        veto: new BigNumber(0),
        last_veto: 0,
      };
      let aliceFinalSharesInfo = context.pairs[0].storage.ledger[
        aliceAddress
      ] || {
        balance: new BigNumber(0),
        frozen_balance: new BigNumber(0),
        allowances: {},
      };
      let aliceFinalCandidateVeto =
        context.pairs[0].storage.vetos[delegate] || new BigNumber(0);
      let finalVetos = context.pairs[0].storage.veto;
      let finalCurrentDelegate = context.pairs[0].storage.current_delegated;
      // 1. tokens frozen
      strictEqual(
        aliceFinalSharesInfo.balance.toNumber(),
        aliceInitSharesInfo.balance.toNumber() - value,
        "Tokens not removed"
      );
      strictEqual(
        aliceFinalSharesInfo.frozen_balance.toNumber(),
        aliceInitSharesInfo.frozen_balance.toNumber() + value,
        "Tokens not frozen"
      );
      // 2. voter info updated
      notStrictEqual(
        aliceFinalVoteInfo.last_veto,
        aliceInitVoteInfo.last_veto,
        "User last veto time wasn't updated"
      );
      strictEqual(
        aliceFinalVoteInfo.veto.toNumber(),
        value,
        "User vetj wasn't updated"
      );
      // 3. veto time set
      notStrictEqual(aliceFinalCandidateVeto, 0, "Delegate wasn't locked");

      // 4. global state updated
      strictEqual(0, finalVetos.toNumber(), "Total votes weren't updated");
      strictEqual(finalCurrentDelegate, null, "Delegate wasn't updated");
    });
  }

  it("should remove veto", async function () {
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // get gelegate address
    await context.updateActor("carol");
    let carolAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    let delegate = carolAddress;
    let value = 500;
    let reward = 1000;

    // vote for the candidate
    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.pairs[0].vote(aliceAddress, delegate, value);

    // update delegator
    await context.pairs[0].sendReward(reward);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegator not set"
    );

    // set veto that is not enough to replace delegator
    value = 10;
    await context.pairs[0].veto(aliceAddress, value);

    // store prev balances
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });

    let aliceInitVoteInfo = context.pairs[0].storage.voters[aliceAddress] || {
      candidate: undefined,
      vote: new BigNumber(0),
      veto: new BigNumber(0),
      last_veto: 0,
    };
    let aliceInitSharesInfo = context.pairs[0].storage.ledger[aliceAddress] || {
      balance: new BigNumber(0),
      frozen_balance: new BigNumber(0),
      allowances: {},
    };
    let aliceInitCandidateVeto =
      context.pairs[0].storage.vetos[delegate] || new BigNumber(0);

    // remove veto votes
    await context.pairs[0].veto(aliceAddress, 0);

    // checks
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    let aliceFinalVoteInfo = context.pairs[0].storage.voters[aliceAddress] || {
      candidate: undefined,
      vote: new BigNumber(0),
      veto: new BigNumber(0),
      last_veto: 0,
    };
    let aliceFinalSharesInfo = context.pairs[0].storage.ledger[
      aliceAddress
    ] || {
      balance: new BigNumber(0),
      frozen_balance: new BigNumber(0),
      allowances: {},
    };
    let aliceFinalCandidateVeto =
      context.pairs[0].storage.vetos[delegate] || new BigNumber(0);
    let finalVetos = context.pairs[0].storage.veto;
    let finalCurrentDelegate = context.pairs[0].storage.current_delegated;
    // 1. tokens frozen
    strictEqual(
      aliceFinalSharesInfo.balance.toNumber(),
      aliceInitSharesInfo.balance.toNumber() + value,
      "Tokens not removed"
    );
    strictEqual(
      aliceFinalSharesInfo.frozen_balance.toNumber(),
      aliceInitSharesInfo.frozen_balance.toNumber() - value,
      "Tokens not frozen"
    );
    // 2. voter info updated
    notStrictEqual(
      aliceFinalVoteInfo.last_veto,
      aliceInitVoteInfo.last_veto,
      "User last veto time wasn't updated"
    );
    strictEqual(
      aliceFinalVoteInfo.veto.toNumber(),
      0,
      "User veto wasn't updated"
    );
    // 3. veto time set
    strictEqual(
      aliceFinalCandidateVeto.toNumber(),
      0,
      "Delegate wasn't locked"
    );
    // 4. global state updated
    strictEqual(0, finalVetos.toNumber(), "Total vetos weren't updated");
    strictEqual(finalCurrentDelegate, delegate, "Delegate updated");
  });

  it("should increment veto", async function () {
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // get gelegate address
    await context.updateActor("carol");
    let carolAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    let delegate = carolAddress;
    let value = 500;
    let reward = 1000;

    // vote for the candidate
    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.pairs[0].vote(aliceAddress, delegate, value);

    // update delegator
    await context.pairs[0].sendReward(reward);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegator not set"
    );

    // set veto that is not enough to replace delegator
    value = 10;
    await context.pairs[0].veto(aliceAddress, value);

    // store prev balances
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });

    let aliceInitVoteInfo = context.pairs[0].storage.voters[aliceAddress] || {
      candidate: undefined,
      vote: new BigNumber(0),
      veto: new BigNumber(0),
      last_veto: 0,
    };
    let aliceInitSharesInfo = context.pairs[0].storage.ledger[aliceAddress] || {
      balance: new BigNumber(0),
      frozen_balance: new BigNumber(0),
      allowances: {},
    };
    let aliceInitCandidateVeto =
      context.pairs[0].storage.vetos[delegate] || new BigNumber(0);

    // remove veto votes
    await context.pairs[0].veto(aliceAddress, value * 2);

    // checks
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    let aliceFinalVoteInfo = context.pairs[0].storage.voters[aliceAddress] || {
      candidate: undefined,
      vote: new BigNumber(0),
      veto: new BigNumber(0),
      last_veto: 0,
    };
    let aliceFinalSharesInfo = context.pairs[0].storage.ledger[
      aliceAddress
    ] || {
      balance: new BigNumber(0),
      frozen_balance: new BigNumber(0),
      allowances: {},
    };
    let aliceFinalCandidateVeto =
      context.pairs[0].storage.vetos[delegate] || new BigNumber(0);
    let finalVetos = context.pairs[0].storage.veto;
    let finalCurrentDelegate = context.pairs[0].storage.current_delegated;
    // 1. tokens frozen
    strictEqual(
      aliceFinalSharesInfo.balance.toNumber() + value,
      aliceInitSharesInfo.balance.toNumber(),
      "Tokens not removed"
    );
    strictEqual(
      aliceFinalSharesInfo.frozen_balance.toNumber(),
      aliceInitSharesInfo.frozen_balance.toNumber() + value,
      "Tokens not frozen"
    );
    // 2. voter info updated
    notStrictEqual(
      aliceFinalVoteInfo.last_veto,
      aliceInitVoteInfo.last_veto,
      "User last veto time wasn't updated"
    );
    strictEqual(
      aliceFinalVoteInfo.veto.toNumber(),
      value * 2,
      "User veto wasn't updated"
    );
    // 3. veto time set
    strictEqual(
      aliceFinalCandidateVeto.toNumber(),
      0,
      "Delegate wasn't locked"
    );
    // 4. global state updated
    strictEqual(
      value * 2,
      finalVetos.toNumber(),
      "Total vetos weren't updated"
    );
    strictEqual(finalCurrentDelegate, delegate, "Delegate updated");
  });

  it("should replace delegator", async function () {
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // get gelegate address
    await context.updateActor("bob");
    let carolAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    let delegate = carolAddress;
    let value = 200;
    let reward = 1000;

    // vote for the candidate
    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.pairs[0].vote(aliceAddress, delegate, value);

    // update delegator
    await context.pairs[0].sendReward(reward);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegator not set"
    );

    // approve tokens
    await context.updateActor("bob");
    let bobAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    await context.pairs[0].approve(bobAddress, value);
    await context.updateActor("bob");

    // veto
    await context.pairs[0].veto(aliceAddress, value);

    // checks
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    let finalVetos = context.pairs[0].storage.veto;
    let finalCurrentDelegate = context.pairs[0].storage.current_delegated;

    strictEqual(0, finalVetos.toNumber(), "Total votes weren't updated");
    strictEqual(finalCurrentDelegate, null, "Delegate wasn't updated");
  });

  it("should not replace delegator if it is None", async function () {
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // get gelegate address
    await context.updateActor("carol");
    let carolAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    let delegate = carolAddress;
    let value = 200;
    let reward = 1000;

    // vote for the candidate
    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.pairs[0].vote(aliceAddress, delegate, value);

    // update delegator
    await context.pairs[0].sendReward(reward);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegator not set"
    );

    // veto
    await context.pairs[0].veto(aliceAddress, value);
    await context.pairs[0].veto(aliceAddress, value);

    // checks
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    let finalVetos = context.pairs[0].storage.veto;
    let finalCurrentDelegate = context.pairs[0].storage.current_delegated;

    strictEqual(0, finalVetos.toNumber(), "Total votes weren't updated");
    strictEqual(finalCurrentDelegate, null, "Delegate wasn't updated");
  });

  it("should set delegator to None if candidate and delegator are the same", async function () {
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // get gelegate address
    await context.updateActor("carol");
    let carolAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    let delegate = carolAddress;
    let value = 500;
    let reward = 1000;

    // vote for the candidate
    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.pairs[0].vote(aliceAddress, delegate, value);

    // update delegator
    await context.pairs[0].sendReward(reward);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegated and real delegated doesn't match"
    );
    strictEqual(
      context.pairs[0].storage.current_candidate,
      null,
      "Candidate doesn't match"
    );

    // veto
    await context.pairs[0].veto(aliceAddress, value);

    // checks
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    let finalCurrentDelegate = context.pairs[0].storage.current_delegated;
    let finalCurrentCandidate = context.pairs[0].storage.current_candidate;
    strictEqual(finalCurrentDelegate, null, "Delegate wasn't updated");
    strictEqual(finalCurrentCandidate, null, "Candidate wasn't updated");
  });

  it("should set delegator to next candidate if candidate and delegator are different", async function () {
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // get gelegate address
    await context.updateActor("carol");
    let carolAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    let delegate = carolAddress;
    let value = 100;
    let reward = 1000;

    // vote for the candidate
    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.pairs[0].vote(aliceAddress, delegate, value);

    // update delegator
    await context.pairs[0].sendReward(reward);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegated and real delegated doesn't match"
    );
    strictEqual(
      context.pairs[0].storage.current_candidate,
      null,
      "Candidate doesn't match"
    );

    // update candidate
    await context.updateActor("bob");
    let bobAddress = await tezos.signer.publicKeyHash();
    let tezAmount = 1000;
    let tokenAmount = 100000;
    let newShares = 100;
    await context.updateActor();
    await context.tokens[0].transfer(aliceAddress, bobAddress, tokenAmount);

    await context.updateActor("bob");
    await context.pairs[0].investLiquidity(tokenAmount, tezAmount, newShares);

    await context.pairs[0].vote(
      bobAddress,
      aliceAddress,
      Math.floor(value / 2)
    );
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    notStrictEqual(
      context.pairs[0].storage.current_delegated,
      context.pairs[0].storage.current_candidate,
      "Delegator and candidate match"
    );
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegated doesn't match after voting"
    );
    strictEqual(
      aliceAddress,
      context.pairs[0].storage.current_candidate,
      "Current candidate wrong"
    );

    // veto
    await context.updateActor();
    await context.pairs[0].veto(aliceAddress, Math.floor(value / 2) + 1);

    // checks
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    let finalCurrentDelegate = context.pairs[0].storage.current_delegated;
    let finalCurrentCandidate = context.pairs[0].storage.current_candidate;
    strictEqual(
      context.pairs[0].storage.veto.toNumber(),
      0,
      "Total veto isn't updated"
    );
    strictEqual(finalCurrentDelegate, aliceAddress, "Delegate wasn't updated");
    strictEqual(finalCurrentCandidate, null, "Candidate was updated");
  });

  it("should withdraw veto if delegator was removed by veto", async function () {
    this.timeout(5000000);
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // get gelegate address
    await context.updateActor("bob");
    let carolAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    let delegate = carolAddress;
    let value = 500;
    let reward = 1000;

    // vote for the candidate
    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.pairs[0].vote(aliceAddress, delegate, value);

    // update delegator
    await context.pairs[0].sendReward(reward);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegator not set"
    );

    // veto
    await context.pairs[0].veto(aliceAddress, value);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      0,
      context.pairs[0].storage.veto.toNumber(),
      "Total votes weren't updated"
    );

    // store prev balances
    let aliceInitVoteInfo = context.pairs[0].storage.voters[aliceAddress] || {
      candidate: undefined,
      vote: new BigNumber(0),
      veto: new BigNumber(0),
      last_veto: 0,
    };
    let aliceInitSharesInfo = context.pairs[0].storage.ledger[aliceAddress] || {
      balance: new BigNumber(0),
      frozen_balance: new BigNumber(0),
      allowances: {},
    };
    let aliceInitCandidateVeto =
      context.pairs[0].storage.vetos[delegate] || new BigNumber(0);

    // checks
    await context.pairs[0].veto(aliceAddress, 0);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    let aliceFinalVoteInfo = context.pairs[0].storage.voters[aliceAddress] || {
      candidate: undefined,
      vote: new BigNumber(0),
      veto: new BigNumber(0),
      last_veto: 0,
    };

    let aliceFinalSharesInfo = context.pairs[0].storage.ledger[
      aliceAddress
    ] || {
      balance: new BigNumber(0),
      frozen_balance: new BigNumber(0),
      allowances: {},
    };

    let aliceFinalCandidateVeto =
      context.pairs[0].storage.vetos[delegate] || new BigNumber(0);
    let finalVetos = context.pairs[0].storage.veto;
    let finalCurrentDelegate = context.pairs[0].storage.current_delegated;
    // 1. tokens frozen
    strictEqual(
      aliceFinalSharesInfo.balance.toNumber(),
      aliceInitSharesInfo.balance.toNumber() + value,
      "Tokens not unfrozen"
    );
    strictEqual(
      aliceFinalSharesInfo.frozen_balance.toNumber(),
      aliceInitSharesInfo.frozen_balance.toNumber() - value,
      "Frozen tokens not removed"
    );
    // 2. voter info updated
    notStrictEqual(
      aliceFinalVoteInfo.last_veto,
      aliceInitVoteInfo.last_veto,
      "User last veto time wasn't updated"
    );
    strictEqual(
      aliceFinalVoteInfo.veto.toNumber(),
      0,
      "User vetj wasn't updated"
    );
    // 3. veto time set
    notStrictEqual(aliceFinalCandidateVeto, 0, "Delegate wasn't locked");

    // 4. global state updated
    strictEqual(0, finalVetos.toNumber(), "Total votes weren't updated");
    strictEqual(finalCurrentDelegate, null, "Delegate wasn't updated");
  });

  it("should fail veto without shares", async function () {
    this.timeout(5000000);
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // change actor
    await context.updateActor("bob");
    let value = 500;
    let bobAddress = await tezos.signer.publicKeyHash();

    // veto
    await rejects(
      context.pairs[0].veto(bobAddress, value),
      (err) => {
        strictEqual(err.message, "Dex/no-shares", "Error message mismatch");
        return true;
      },
      "Veto should fail"
    );
  });

  it("should fail veto without enough shares", async function () {
    this.timeout(5000000);
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    // get gelegate address
    await context.updateActor("bob");
    let carolAddress = await tezos.signer.publicKeyHash();
    await context.updateActor();
    let delegate = carolAddress;
    let value = 600;
    let reward = 1000;

    // vote for the candidate
    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.pairs[0].vote(aliceAddress, delegate, value);

    // update delegator
    await context.pairs[0].sendReward(reward);
    await context.pairs[0].updateStorage({
      ledger: [aliceAddress],
      voters: [aliceAddress],
      vetos: [delegate],
    });
    strictEqual(
      context.pairs[0].storage.current_delegated,
      delegate,
      "Delegator not set"
    );

    // veto
    await rejects(
      context.pairs[0].veto(aliceAddress, value),
      (err) => {
        strictEqual(
          err.message,
          "Dex/not-enough-balance",
          "Error message mismatch"
        );
        return true;
      },
      "Vote should fail"
    );
  });

  it("should fail veto without allowance", async function () {
    this.timeout(5000000);
    // reset pairs
    await context.flushPairs();
    await context.createPairs();

    let aliceAddress = await tezos.signer.publicKeyHash();
    await context.updateActor("carol");
    let value = 200;

    // veto
    await context.updateActor("bob");
    await rejects(
      context.pairs[0].veto(aliceAddress, value),
      (err) => {
        strictEqual(
          err.message,
          "Dex/not-enough-allowance",
          "Error message mismatch"
        );
        return true;
      },
      "Vote should fail"
    );
  });
});