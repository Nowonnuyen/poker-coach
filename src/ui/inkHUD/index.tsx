// src/ui/inkHUD/index.tsx
import React from "react";
import { render, Box, Text } from "ink";
import fs from "fs";
import path from "path";

const sessionPath = path.resolve(process.cwd(), "session.json");

type SessionData = {
  handNumber?: number;
  advice?: string;
  mathAdvice?: string;
  emotion?: string;
  tableProfile?: string;
};

const PokerHUD: React.FC = () => {
  const [data, setData] = React.useState<SessionData | null>(null);

  React.useEffect(() => {
    const loadData = () => {
      try {
        const json = fs.readFileSync(sessionPath, "utf-8");
        setData(JSON.parse(json));
      } catch {
        setData(null);
      }
    };

    // 🔄 Charge une fois au démarrage
    loadData();

    // 👀 Surveille les changements du fichier en temps réel
    fs.watchFile(sessionPath, { interval: 1000 }, (curr, prev) => {
      if (curr.mtimeMs !== prev.mtimeMs) {
        loadData();
      }
    });

    return () => {
      fs.unwatchFile(sessionPath);
    };
  }, []);

  return (
    <Box
      flexDirection="column"
      padding={1}
      borderStyle="round"
      borderColor="green"
    >
      <Box>
        <Text color="greenBright">🎮 POKER HUD (LIVE)</Text>
      </Box>

      {data ? (
        <>
          <Box marginTop={1}>
            <Text>🕹️  Main n° {data.handNumber ?? "-"}</Text>
          </Box>
          <Box>
            <Text>💡 Conseil : {data.advice ?? "-"}</Text>
          </Box>
          <Box>
            <Text>🧮 Math : {data.mathAdvice ?? "-"}</Text>
          </Box>
          <Box>
            <Text>🔴 Émotion : {data.emotion ?? "-"}</Text>
          </Box>
          <Box>
            <Text>📊 Profil : {data.tableProfile ?? "-"}</Text>
          </Box>
        </>
      ) : (
        <Box marginTop={1}>
          <Text color="gray">
            En attente de session.json...
          </Text>
        </Box>
      )}
    </Box>
  );
};

render(<PokerHUD />);
