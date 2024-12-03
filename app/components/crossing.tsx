"use client"

import { useState, useEffect, ReactNode, forwardRef, useImperativeHandle } from 'react'
import LightComponent from './light'
import Clock from '../domain/clock'
import TrafficLight from '../domain/traffic-light'
import LightConfig, { LightSettings, DEFAULT_LIGHT_SETTINGS } from '../domain/light-config'
import Failure from '../domain/failure'
import Input from './input'
import { Card, CardContent, Collapse, Fab, Stack, Checkbox, IconButton, CardActions, Box, Button, Tabs, Tab, Dialog, Slide, AppBar, Toolbar, Typography, List, ListItemButton, ListItemText, Divider, FormControlLabel } from '@mui/material'
import AddIcon from '@mui/icons-material/Add'
import useStateParams, { LightSettingsSerDeser, CrossingSettingsSerDeser } from '../url'
import CrossingSettings, { DEFAULT_CROSSING_SETTINGS } from '../domain/crossing-settings'
import { ExpandMore } from './expand-more'
import ShareIcon from '@mui/icons-material/Share'
import FullscreenIcon from '@mui/icons-material/Fullscreen'
import SettingsIcon from '@mui/icons-material/Settings'
import DeleteIcon from '@mui/icons-material/Delete'
import Fullscreen from './fullscreen'
import LightIcon from './light-icon'
import React from 'react'
import ShareDialog from './share-dialog'
import syncTime from '../domain/time-sync'
import SyncAltIcon from '@mui/icons-material/SyncAlt'

export type BatchMode = 'none' | 'share' | 'fullscreen'

export default forwardRef(function CrossingComponent({ onToolbarChange, selectionMode, onSelectionChanged }: { onToolbarChange: (replace: boolean, e: React.JSX.Element) => void, selectionMode: boolean, onSelectionChanged: (total: number, selected: number) => void }, ref) {

  const [crossingSettings, setCrossingSettings] = useStateParams(DEFAULT_CROSSING_SETTINGS, "crossing", CrossingSettingsSerDeser)

  const [timeCorrection, setTimeCorrection] = useState(0)

  const [currentTimestamp, setCurrentTimestamp] = useState(Date.now())

  const [expanded, setExpanded] = useState(false)

  const [quickEditEnabled, setQuickEditEnabled] = useState(true)

  const [selected, _setSelected] = useState<number[]>([])

  const [fullscreenMode, setFullscreenMode] = useState<number[]>([])

  const [shareMode, setShareMode] = useState<number[]>([])

  const [batchMode, setBatchMode] = useState<BatchMode>('none')

  const [lightSettings, setLightSettings] = useStateParams([DEFAULT_LIGHT_SETTINGS], "lights", LightSettingsSerDeser)

  const failure = new Failure(crossingSettings.failure.duration, crossingSettings.failure.probability)

  const hasFailed = failure.currentState(currentTimestamp)

  const lightConfigs = lightSettings.map(lightSetting => new LightConfig(crossingSettings, lightSetting))

  const lights = lightConfigs.map(lightConfig => new TrafficLight(lightConfig, hasFailed))


  useImperativeHandle(ref, () => ({

    getAlert(value: boolean) {
      // alert("getAlert from Child");
      onAllSelectionChanged(value)
    },

    enterFullscreen() {
      setFullscreenMode(lightConfigs.length > 1 ? selected : [0])
    },

    enterShareDialog() {
      setShareMode(lightConfigs.length > 1 ? selected : [0])
    }

  }));

  const wrapListener = {
    nextStateTimestamp: (timestamp: number) => (Math.floor(timestamp / crossingSettings.cycleLength) + 1) * crossingSettings.cycleLength
  }

  const [selectedTab, setSelectedTab] = React.useState(0)

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue)
  }

  const clock = new Clock(timeCorrection)

  const initTimeSync = () => syncTime()
    .then(correction => setTimeCorrection(correction))
    .catch(e => setTimeCorrection(0))
  
  const setSelected = (idx: number[]) => {
    _setSelected(idx)
    onSelectionChanged(lightConfigs.length, idx.length)
  }

  const checkbox = () => (
    <Checkbox 
      edge="start"
      size='medium'
      checked={selected.length == lightSettings.length} 
      indeterminate={selected.length != lightSettings.length && selected.length > 0} 
      aria-label='select all'
      onChange={e => {
        onAllSelectionChanged(e.target.checked)
      }}
      color='default'
    />
  )

  const batchModeToolbarElements = () => (
    <>
      {checkbox()}
      <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
        Select all
      </Typography>
      
      <Button color='inherit' onClick={e => {
        setBatchMode('none')
        // onToolbarChange(false, baseToolbarElements())
      }}>
        cancel
      </Button>
      <Button color='inherit' onClick={e => {
        if (batchMode == 'fullscreen') {
          setFullscreenMode(selected)
        } else {
          setShareMode(selected)
        }
        setBatchMode('none')
        // onToolbarChange(false, baseToolbarElements())
      }}>
        ok
      </Button>
    </>
  )
  
  const baseToolbarElements = () => (
    <>
      <IconButton 
        aria-label='share'
        onClick={() => {
          if (lightConfigs.length > 1) {
            setBatchMode('share')
            // onToolbarChange(true, batchModeToolbarElements())
          } else {
            setShareMode(lightConfigs.map((x, i) => i))
          }
        }}
        color='inherit'
      >
        <ShareIcon />
      </IconButton>
      <IconButton 
        aria-label='fullscreen'
        onClick={() => {
          if (lightConfigs.length > 1) {
            setBatchMode('fullscreen')
            // onToolbarChange(true, batchModeToolbarElements())
          } else {
            setFullscreenMode(lightConfigs.map((x, i) => i))
          }
        }}
        color='inherit'
      >
        <FullscreenIcon />
      </IconButton>
    </> 
  )

  // const toolbarElements = () => batchMode == 'none' ? baseToolbarElements() : batchModeToolbarElements()

  // const toolbarReplace = () => batchMode != 'none'

  // once
  useEffect(() => {
    // onToolbarChange(toolbarReplace(), toolbarElements())
    onSelectionChanged(lightConfigs.length, selected.length)
    initTimeSync()
  }, [])

  // after each render
  useEffect(() => {
    clock.register([...lights, failure, wrapListener]).then(setCurrentTimestamp)
    return () => {
      clock.unregister()
    }
  })

  const updateLightSettings = (settings: LightSettings, index: number) => {
    const copy = [...lightSettings]
    copy.splice(index, 1, settings)
    setLightSettings(copy)
    setCurrentTimestamp(clock.now())
  }

  const updateCrossingSettings = (crossingSettings: CrossingSettings) => {
    setCrossingSettings(crossingSettings)
    setCurrentTimestamp(clock.now())
  }

  const onAdd = () => {
    const updatedLightSettings = [...lightSettings, DEFAULT_LIGHT_SETTINGS]
    setLightSettings(updatedLightSettings)
    onSelectionChanged(updatedLightSettings.length, selected.length)
    // onToolbarChange(toolbarReplace(), toolbarElements())
  }

  const onDelete = (indicesToDelete: number[]) => {
    setSelected([])
    const updatedLightSettings = [...lightSettings].filter((ls, i) => !indicesToDelete.includes(i))
    setLightSettings(updatedLightSettings)
    onSelectionChanged(updatedLightSettings.length, 0)
    // onToolbarChange(toolbarReplace(), toolbarElements())
  }

  const handleExpandClick = () => {
    setExpanded(!expanded);
  }

  const onAllSelectionChanged = (b: boolean) => {
    setSelected(b ? lights.map((l, i) => i) : [])
    // onToolbarChange(toolbarReplace(), toolbarElements())
  }

  const getShareUrl = () => {
    if (shareMode.length == 0) {
      return ""
    } 

    const selectedLightSettings = lightSettings.filter((ls, index) => shareMode.includes(index))

    const search = `?crossing=${CrossingSettingsSerDeser.serialize(crossingSettings)}&lights=${LightSettingsSerDeser.serialize(selectedLightSettings)}`

    const baseUrl = typeof window === "undefined" ? process.env.NEXT_PUBLIC_SITE_URL : window.location.origin
    // const baseUrl = "http://192.168.0.106:3000" 
    return baseUrl + search
  }  


  return (
    <Stack spacing={2} sx={{ p: 1, m: 1 }}>
      {/* <Card sx={{ position: 'sticky', top: '2px', zIndex: 100 }}>
        <CardActions>
          <Checkbox 
            checked={selected.length == lightSettings.length} 
            indeterminate={selected.length != lightSettings.length && selected.length > 0} 
            aria-label='select all'
            onChange={e => onAllSelectionChanged(e.target.checked)} 
          />
          <IconButton 
            disabled={ selected.length == 0 } 
            aria-label='fullscreen'
            onClick={() => setFullscreenMode(selected)}
          >
            <FullscreenIcon />
          </IconButton>
          <IconButton 
            disabled={ selected.length == 0 } 
            aria-label='share'
            onClick={() => setShareMode(selected)}
          >
            <ShareIcon />
          </IconButton>
          <IconButton 
            disabled={ selected.length == 0 } 
            aria-label='delete'
            onClick={() => onDelete(selected)}
          >
            <DeleteIcon />
          </IconButton>

          <ExpandMore
              expand={expanded}
              onClick={handleExpandClick}
              aria-expanded={expanded}
              aria-label="show more"
              style={{marginLeft: 'auto'}}
            >
              <SettingsIcon />
            </ExpandMore>
        </CardActions>

        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <CardContent>
            <form>
              <Input 
                label="Cycle length" 
                id="cycle-length" 
                min={10}
                max={180}
                value={crossingSettings.cycleLength / 1000} 
                onChange={ e => updateCrossingSettings({ ...crossingSettings, cycleLength: Number(e.target.value) * 1000 }) } 
              />
              <Input 
                label="Failure duration" 
                id="failure-duration" 
                min={10}
                max={180}
                value={crossingSettings.failure.duration / 1000} 
                onChange={ e => updateCrossingSettings({ ...crossingSettings, failure: { probability: crossingSettings.failure.probability, duration: Number(e.target.value) * 1000 } }) } 
              />
              <Input 
                label="Failure probability" 
                id="failure-probability" 
                min={0}
                max={1}
                step={0.1}
                value={crossingSettings.failure.probability} 
                onChange={ e => updateCrossingSettings({ ...crossingSettings, failure: { duration: crossingSettings.failure.duration, probability: Number(e.target.value) } }) } 
              />
              <Input 
                label="Time correction" 
                id="time-correction" 
                min={-1000}
                max={1000}
                step={10}
                value={timeCorrection} 
                onChange={e => setTimeCorrection(e.target.value)} 
              />
              <Button onClick={initTimeSync}>Sync time</Button>
            </form>
          </CardContent>
        </Collapse>
      </Card> */}

      {/* <Tabs value={selectedTab} onChange={handleTabChange} aria-label="basic tabs example">
        <Tab label={<SettingsIcon />} />
        <Tab label={<ShareIcon />} />
        <Tab label={<FullscreenIcon />} />
        <Tab label={<SyncAltIcon />} />
      </Tabs> */}


      { lights.map((light, index) =>
        <LightComponent
          key={index}
          index={index}
          currentTimestamp={currentTimestamp}
          light={light}
          lightConfig={lightConfigs[index]}
          selected={selected.includes(index)}
          onLightSettingsChange={(settings: LightSettings) => updateLightSettings(settings, index)}
          onDelete={lights.length > 1 ? () => onDelete([index]) : undefined}
          onSelectionChange={(checked) => checked ? setSelected([...selected, index]) : setSelected(selected.filter(x => x != index))}
          onFullscreen={() => setFullscreenMode([index])}
          onShare={() => setShareMode([index])}
          quickEditEnabled={quickEditEnabled}
          toggleQuickEdit={() => setQuickEditEnabled(!quickEditEnabled)}
          selectionMode={selectionMode}
        />
      )}

      <Fullscreen
        enabled={fullscreenMode.length > 0}
        onDisabled={() => setFullscreenMode([])}
      >
        { lights.filter((light, index) => fullscreenMode.includes(index)).map((light, index) =>
          <Box key={`fullscreen-light-${index}`} sx={{ mx: 2 }}>
            <LightIcon currentTimestamp={currentTimestamp} light={light} lightConfig={light.lightConfig} height='95vh'/>
          </Box>
        )}
      </Fullscreen>

      <ShareDialog
        url={getShareUrl()}
        open={shareMode.length > 0}
        onClose={() => setShareMode([])}
      />
      <Fab color="primary" aria-label="add" onClick={onAdd} style={{ margin: 0, top: 'auto', right: 20, bottom: 20, left: 'auto', position: 'fixed' }}>
        <AddIcon />
      </Fab>
    </Stack>
  )
}
)