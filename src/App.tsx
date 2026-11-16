import React from 'react';
import { ModulProvider, useModul } from './context/ModulContext';
import { AppShell } from './components/layout/AppShell';
import { Screen01Cover } from './components/screens/Screen01Cover';
import { Screen02Petunjuk } from './components/screens/Screen02Petunjuk';
import { Screen03PetaPerjalanan } from './components/screens/Screen03PetaPerjalanan';
import { Screen04Tujuan } from './components/screens/Screen04Tujuan';
import { Screen05Pemantik } from './components/screens/Screen05Pemantik';
import { Screen06FluksMagnetik } from './components/screens/Screen06FluksMagnetik';
import { Screen07HukumFaraday } from './components/screens/Screen07HukumFaraday';
import { Screen08HukumLenz } from './components/screens/Screen08HukumLenz';
import { Screen09EksperimenKit } from './components/screens/Screen09EksperimenKit';
import { Screen10TantanganStem } from './components/screens/Screen10TantanganStem';
import { Screen11Brainstorming } from './components/screens/Screen11Brainstorming';
import { Screen12SketsaDesain } from './components/screens/Screen12SketsaDesain';
import { Screen13MembuatPrototipe } from './components/screens/Screen13MembuatPrototipe';
import { Screen14Testing } from './components/screens/Screen14Testing';
import { Screen15Improve } from './components/screens/Screen15Improve';
import { Screen16Presentasi } from './components/screens/Screen16Presentasi';
import { Screen17Refleksi } from './components/screens/Screen17Refleksi';

const ScreenRouter: React.FC = () => {
  const { state } = useModul();

  switch (state.currentScreen) {
    case 1:
      return <Screen01Cover />;
    case 2:
      return <Screen02Petunjuk />;
    case 3:
      return <Screen03PetaPerjalanan />;
    case 4:
      return <Screen04Tujuan />;
    case 5:
      return <Screen05Pemantik />;
    case 6:
      return <Screen06FluksMagnetik />;
    case 7:
      return <Screen07HukumFaraday />;
    case 8:
      return <Screen08HukumLenz />;
    case 9:
      return <Screen09EksperimenKit />;
    case 10:
      return <Screen10TantanganStem />;
    case 11:
      return <Screen11Brainstorming />;
    case 12:
      return <Screen12SketsaDesain />;
    case 13:
      return <Screen13MembuatPrototipe />;
    case 14:
      return <Screen14Testing />;
    case 15:
      return <Screen15Improve />;
    case 16:
      return <Screen16Presentasi />;
    case 17:
      return <Screen17Refleksi />;
    default:
      return <Screen01Cover />;
  }
};

export function App() {
  return (
    <ModulProvider>
      <AppShell>
        <ScreenRouter />
      </AppShell>
    </ModulProvider>
  );
}

export default App;

