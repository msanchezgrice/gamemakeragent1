export type Clock = () => Date;
export declare function systemClock(): Date;
export declare const monotonicClock: Clock;
