type storage is big_map(nat, bool);

type return is list (operation) * storage;
const no_op : list (operation) = nil;

type action is Write of address | Read;

function get_write_listener(const addr : address) : contract(unit) is
  case (Tezos.get_contract_opt(addr) : option(contract(unit))) of
  | Some(contr) -> contr
  | None -> (failwith("cant-get-write-listener") : contract(unit))
end

function write (const write_listener: address; var s : storage) : return is
block {
    s[0n] := True;
    const notification : operation = Tezos.transaction(unit, 0mutez, get_write_listener(write_listener));
} with (list [ notification ], s)

function read (const s : storage) : return is
block {
    case s[0n] of 
     Some(v) -> failwith("Big_map changed")
    | None -> failwith("Big map hasn't changed")
    end;
} with (no_op , s)

function main (const action : action; const s : storage) : return is
  case action of
   Write(addr) -> write(addr, s)
  | Read -> read (s)
  end