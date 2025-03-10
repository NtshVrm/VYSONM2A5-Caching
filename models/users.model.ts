import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
} from "typeorm";
import { URLShortener } from "./url-shortener.model";

@Entity("users")
export class Users {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "text", unique: true, nullable: false })
  email!: string;

  @Column({ type: "text", nullable: true })
  name!: string;

  @Column({ type: "text", nullable: false, default: "hobby" })
  tier!: string;

  @Column({ type: "text", unique: true, nullable: false })
  api_key!: string;

  @CreateDateColumn({ type: "timestamp", default: () => "CURRENT_TIMESTAMP" })
  created_at!: Date;

  @OneToMany(() => URLShortener, (urlShortener) => urlShortener.user)
  urlShorteners!: URLShortener[];
}
