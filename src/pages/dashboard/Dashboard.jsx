// src/components/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import api from '../../services/api.js';
import styles from './Dashboard.module.css';

import Card from '../../components/ui/Card';
import Atividades from '../../components/common/Atividades';
import QuickActions from '../../components/common/QuickActions';
import StatsCard from '../../components/ui/Cards/StatCard.jsx';
import TasksDay from '../../components/ui/Cards/TasksDay.jsx';
import RecentProcesses from '../../components/ui/Cards/RecentProcesses.jsx';


function Dashboard() {

    return (
        <div className={styles.dashboard_container}>

            <StatsCard></StatsCard>
            <TasksDay></TasksDay>
            <RecentProcesses></RecentProcesses>

        </div>
    );
}

export default Dashboard;