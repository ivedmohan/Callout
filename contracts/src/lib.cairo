use starknet::ContractAddress;

#[derive(Drop, Serde, starknet::Store)]
pub struct Bet {
    pub id: felt252,
    pub creator: ContractAddress,
    pub title: felt252,
    pub option_a: felt252,
    pub option_b: felt252,
    pub stake_amount: u256,
    pub deadline: u64,
    pub settled: bool,
    pub winning_option: u8,
    pub total_pot: u256,
    pub participant_count: u32,
}

#[derive(Drop, Serde, starknet::Store)]
pub struct Participant {
    pub address: ContractAddress,
    pub option: u8,
    pub has_claimed: bool,
}

#[starknet::interface]
pub trait IERC20<TContractState> {
    fn transfer_from(
        ref self: TContractState, sender: ContractAddress, recipient: ContractAddress, amount: u256
    ) -> bool;
    fn transfer(ref self: TContractState, recipient: ContractAddress, amount: u256) -> bool;
}

#[starknet::interface]
pub trait IBetEscrow<TContractState> {
    fn create_bet(
        ref self: TContractState,
        title: felt252,
        option_a: felt252,
        option_b: felt252,
        stake_amount: u256,
        deadline: u64,
    ) -> felt252;
    fn join_bet(ref self: TContractState, bet_id: felt252, option: u8);
    fn settle_bet(ref self: TContractState, bet_id: felt252, winning_option: u8);
    fn claim_payout(ref self: TContractState, bet_id: felt252);
    fn get_bet(self: @TContractState, bet_id: felt252) -> Bet;
    fn get_participant(self: @TContractState, bet_id: felt252, index: u32) -> Participant;
    fn get_participant_count(self: @TContractState, bet_id: felt252) -> u32;
    fn get_bet_count(self: @TContractState) -> felt252;
}

#[starknet::contract]
pub mod BetEscrow {
    use super::{Bet, Participant, IBetEscrow, IERC20Dispatcher, IERC20DispatcherTrait};
    use starknet::storage::*;
    use starknet::{
        ContractAddress, get_caller_address, get_block_timestamp, contract_address_const,
        get_contract_address
    };

    #[storage]
    struct Storage {
        bet_count: felt252,
        bets: Map<felt252, Bet>,
        participants: Map<(felt252, u32), Participant>,
        has_joined: Map<(felt252, ContractAddress), bool>,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        BetCreated: BetCreated,
        BetJoined: BetJoined,
        BetSettled: BetSettled,
        PayoutClaimed: PayoutClaimed,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BetCreated {
        #[key]
        pub bet_id: felt252,
        pub creator: ContractAddress,
        pub title: felt252,
        pub stake_amount: u256,
        pub deadline: u64,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BetJoined {
        #[key]
        pub bet_id: felt252,
        pub participant: ContractAddress,
        pub option: u8,
    }

    #[derive(Drop, starknet::Event)]
    pub struct BetSettled {
        #[key]
        pub bet_id: felt252,
        pub winning_option: u8,
    }

    #[derive(Drop, starknet::Event)]
    pub struct PayoutClaimed {
        #[key]
        pub bet_id: felt252,
        pub participant: ContractAddress,
        pub amount: u256,
    }

    #[abi(embed_v0)]
    impl BetEscrowImpl of IBetEscrow<ContractState> {
        fn create_bet(
            ref self: ContractState,
            title: felt252,
            option_a: felt252,
            option_b: felt252,
            stake_amount: u256,
            deadline: u64
        ) -> felt252 {
            let caller = get_caller_address();
            let current_time = get_block_timestamp();
            assert!(deadline > current_time, "Deadline must be in the future");
            assert!(stake_amount > 0, "Stake must be greater than 0");

            let bet_id = self.bet_count.read() + 1;
            self.bet_count.write(bet_id);

            let strk_addr =
                contract_address_const::<
                    0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
                >();
            let strk = IERC20Dispatcher { contract_address: strk_addr };
            strk.transfer_from(caller, get_contract_address(), stake_amount);

            let bet = Bet {
                id: bet_id,
                creator: caller,
                title,
                option_a,
                option_b,
                stake_amount,
                deadline,
                settled: false,
                winning_option: 255,
                total_pot: stake_amount,
                participant_count: 1
            };
            self.bets.entry(bet_id).write(bet);

            let participant = Participant { address: caller, option: 0, has_claimed: false };
            self.participants.entry((bet_id, 0)).write(participant);
            self.has_joined.entry((bet_id, caller)).write(true);

            self.emit(Event::BetCreated(BetCreated { bet_id, creator: caller, title, stake_amount, deadline }));
            bet_id
        }

        fn join_bet(ref self: ContractState, bet_id: felt252, option: u8) {
            let caller = get_caller_address();
            let mut bet = self.bets.entry(bet_id).read();

            assert!(bet.id != 0, "Bet does not exist");
            assert!(!bet.settled, "Bet already settled");
            assert!(get_block_timestamp() < bet.deadline, "Bet deadline passed");
            assert!(option <= 1, "Invalid option");
            assert!(!self.has_joined.entry((bet_id, caller)).read(), "Already joined");

            let strk_addr =
                contract_address_const::<
                    0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
                >();
            let strk = IERC20Dispatcher { contract_address: strk_addr };
            strk.transfer_from(caller, get_contract_address(), bet.stake_amount);

            let idx = bet.participant_count;
            let participant = Participant { address: caller, option, has_claimed: false };
            self.participants.entry((bet_id, idx)).write(participant);
            self.has_joined.entry((bet_id, caller)).write(true);

            bet.total_pot += bet.stake_amount;
            bet.participant_count = idx + 1;
            self.bets.entry(bet_id).write(bet);

            self.emit(Event::BetJoined(BetJoined { bet_id, participant: caller, option }));
        }

        fn settle_bet(ref self: ContractState, bet_id: felt252, winning_option: u8) {
            let caller = get_caller_address();
            let mut bet = self.bets.entry(bet_id).read();

            assert!(bet.id != 0, "Bet does not exist");
            assert!(caller == bet.creator, "Only creator can settle");
            assert!(!bet.settled, "Already settled");
            assert!(winning_option <= 1, "Invalid option");

            bet.settled = true;
            bet.winning_option = winning_option;
            self.bets.entry(bet_id).write(bet);

            self.emit(Event::BetSettled(BetSettled { bet_id, winning_option }));
        }

        fn claim_payout(ref self: ContractState, bet_id: felt252) {
            let caller = get_caller_address();
            let bet = self.bets.entry(bet_id).read();

            assert!(bet.id != 0, "Bet does not exist");
            assert!(bet.settled, "Bet not settled yet");

            let mut found = false;
            let mut caller_option: u8 = 255;
            let mut caller_idx: u32 = 0;
            let mut i: u32 = 0;

            loop {
                if i >= bet.participant_count {
                    break;
                }
                let p = self.participants.entry((bet_id, i)).read();
                if p.address == caller {
                    assert!(!p.has_claimed, "Already claimed");
                    found = true;
                    caller_option = p.option;
                    caller_idx = i;
                    break;
                }
                i += 1;
            };

            assert!(found, "Not a participant");
            assert!(caller_option == bet.winning_option, "You did not win");

            let mut winner_count: u32 = 0;
            let mut j: u32 = 0;
            loop {
                if j >= bet.participant_count {
                    break;
                }
                let p = self.participants.entry((bet_id, j)).read();
                if p.option == bet.winning_option {
                    winner_count += 1;
                }
                j += 1;
            };

            assert!(winner_count > 0, "No winners found");
            let payout = bet.total_pot / winner_count.into();

            let mut participant = self.participants.entry((bet_id, caller_idx)).read();
            participant.has_claimed = true;
            self.participants.entry((bet_id, caller_idx)).write(participant);

            let strk_addr =
                contract_address_const::<
                    0x04718f5a0fc34cc1af16a1cdee98ffb20c31f5cd61d6ab07201858f4287c938d
                >();
            let strk = IERC20Dispatcher { contract_address: strk_addr };
            strk.transfer(caller, payout);

            self.emit(Event::PayoutClaimed(PayoutClaimed { bet_id, participant: caller, amount: payout }));
        }

        fn get_bet(self: @ContractState, bet_id: felt252) -> Bet {
            self.bets.entry(bet_id).read()
        }

        fn get_participant(self: @ContractState, bet_id: felt252, index: u32) -> Participant {
            self.participants.entry((bet_id, index)).read()
        }

        fn get_participant_count(self: @ContractState, bet_id: felt252) -> u32 {
            let bet = self.bets.entry(bet_id).read();
            bet.participant_count
        }

        fn get_bet_count(self: @ContractState) -> felt252 {
            self.bet_count.read()
        }
    }
}