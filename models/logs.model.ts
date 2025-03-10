import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity("logs")
export class Logs {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn({ type: "timestamp" })
  timestamp!: Date;

  @Column({ type: "text" })
  method!: string;

  @Column({ type: "text" })
  "user-agent"!: string;

  @Column({ type: "text" })
  url!: string;

  @Column({ type: "text", nullable: true }) // IP can be nullable
  ip!: string | null;
}
