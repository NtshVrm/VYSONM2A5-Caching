import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  JoinColumn,
  ManyToOne,
} from "typeorm";
import { Users } from "./users.model";

@Entity("url_shortener")
export class URLShortener {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column("text")
  original_url!: string;

  @Column("text", { unique: true })
  short_code!: string;

  @Column("text", { nullable: true, default: null })
  password!: string | null;

  @Column("int", { default: 0 })
  visit_count!: number;

  @CreateDateColumn({ type: "timestamp" })
  last_accessed_at!: Date;

  @CreateDateColumn({ type: "timestamp" })
  created_at!: Date;

  @CreateDateColumn({ type: "timestamp", nullable: true, default: null })
  expiry_date!: Date | null;
  // Foreign key to the User entity
  @ManyToOne(() => Users, (user) => user.urlShorteners, { nullable: false })
  @JoinColumn({ name: "user_id" }) // Specify the column name in the database
  user!: Users;
}
