import RobotController from "./cleaning_robots/cleaning_robots";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={`${styles.page} flex min-h-screen flex-col items-center`}>
      {/* <EcoResolution /> */}
      <RobotController />
    </main>
  );
}
