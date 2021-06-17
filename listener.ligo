type storage is address;

type return is list (operation) * storage;
const no_op : list (operation) = nil;

type writer_action is Write of address | Read;

function get_writer_contract(const addr : address) : contract(writer_action) is
  case (Tezos.get_contract_opt(addr) : option(contract(writer_action))) of
  | Some(contr) -> contr
  | None -> (failwith("cant-get-writer") : contract(writer_action))
end

function main (const action : unit; const s : storage) : return is
  block {
    const read_request : operation = Tezos.transaction(Read, 0mutez, get_writer_contract(s));
  } with (list [ read_request ], s)