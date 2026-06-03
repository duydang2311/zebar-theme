<script lang="ts">
    import {
        hexFromArgb,
        sourceColorFromImageBytes,
        themeFromSourceColor,
    } from '@material/material-color-utilities';
    import { onMount } from 'svelte';
    import * as zebar from 'zebar';
    import SkipBack from '~icons/heroicons/backward';
    import SkipForward from '~icons/heroicons/forward';
    import Pause from '~icons/heroicons/pause-circle-16-solid';
    import Play from '~icons/heroicons/play-16-solid';
    import BatteryCharging from '~icons/lucide/battery-charging';
    import BatteryFull from '~icons/lucide/battery-full';
    import BatteryLow from '~icons/lucide/battery-low';
    import BatteryMedium from '~icons/lucide/battery-medium';
    import CPU from '~icons/lucide/cpu';
    import ListMusic from '~icons/lucide/list-music';
    import MemoryStick from '~icons/lucide/memory-stick';
    import Volume from '~icons/lucide/volume';
    import VolumeLow from '~icons/lucide/volume-1';
    import VolumeHigh from '~icons/lucide/volume-2';
    import VolumeMuted from '~icons/lucide/volume-x';
    import Slider from './lib/components/Slider.svelte';
    import { getCurrentWallpaper, readFile } from './lib/utils/shell';

    const providers = zebar.createProviderGroup({
        audio: { type: 'audio' },
        cpu: { type: 'cpu' },
        battery: { type: 'battery' },
        date: { type: 'date' },
        memory: { type: 'memory' },
        media: { type: 'media' },
        systray: { type: 'systray' },
        glazewm: { type: 'glazewm' },
    });

    let outputs = $state(providers.outputMap);
    let wallpaper: Awaited<ReturnType<typeof getCurrentWallpaper>> = {
        path: null,
        ticks: null,
    };
    let expandMedia = $state.raw(false);
    let expandAudio = $state.raw(false);

    async function updateThemeFromWallpaper(value: typeof wallpaper) {
        if (wallpaper.path !== value.path || wallpaper.ticks !== value.ticks) {
            wallpaper = value;
            if (wallpaper.path) {
                console.log('calling updateTheme');
                return updateTheme(wallpaper.path);
            }
        }
    }

    async function updateTheme(path: string) {
        const base64 = await readFile(zebar, path);
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], {
            type: 'image/png',
        });

        const bitmap = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;

        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(bitmap, 0, 0);
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        const sourceColor = sourceColorFromImageBytes(pixels);
        const theme = themeFromSourceColor(sourceColor);

        bitmap.close();
        canvas.width = 0;
        canvas.height = 0;

        const root = document.documentElement;
        for (const [key, value] of Object.entries(
            theme.schemes.dark.toJSON()
        )) {
            root.style.setProperty(
                '--color-' +
                    key.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase()),
                hexFromArgb(value)
            );
        }
        root.style.setProperty('--color-fg', 'var(--color-on-surface-variant)');
        root.style.setProperty('--color-fg-muted', 'color-mix(in oklch, var(--color-secondary) 40%, transparent)');
    }

    providers.onOutput((map) => {
        outputs = map;
    });

    onMount(() => {
        getCurrentWallpaper(zebar)
            .then(updateThemeFromWallpaper)
            .catch(console.error);
        const interval = setInterval(async () => {
            const value = await getCurrentWallpaper(zebar);
            await updateThemeFromWallpaper(value);
        }, 2000);
        return () => {
            clearInterval(interval);
        };
    });
</script>

<div
    class="relative flex h-screen px-4 py-2 gap-8 select-none text-fg text-nowrap"
>
    <div class="flex-1 flex gap-4">
        {#if outputs.glazewm}
            {#if outputs.glazewm.bindingModes.length}
                {#each outputs.glazewm.bindingModes as mode (mode.name)}

                    <div class="content-center text-tertiary">
                        {mode.displayName || mode.name}
                    </div>
                    <div class="flex items-center">
                        <div class="w-px h-3 bg-outline-variant"></div>
                    </div>
                {/each}
            {/if}
            <div
                class="flex items-center gap-2 hover:bg-secondary-container hover:text-on-secondary-container has-[>button:active]:bg-secondary-container/40 rounded-md transition"
            >
                <button type="button" class="px-2 py-1" onclick={() => {
                    outputs.glazewm!.runCommand('toggle-tiling-direction');
                }}>
                {#if outputs.glazewm.tilingDirection === 'horizontal'}
                    H
                {:else}
                    V
                {/if}
                </button>
            </div>
            <div class="flex items-center">
                <div class="w-px h-3 bg-outline-variant"></div>
            </div>
            <div class="flex items-center">
                {#each outputs.glazewm.currentWorkspaces as workspace (workspace.id)}
                    <button
                        type="button"
                        data-active={workspace.hasFocus ? '' : undefined}
                        class="text-fg-muted data-active:bg-primary-container data-active:text-on-primary-container not-data-active:hover:bg-primary-container/60 not-data-active:active:bg-primary-container/20 h-full px-2 aspect-square text-base! rounded-full text-center content-center transition"
                        onclick={() => {
                            outputs.glazewm!.runCommand(`focus --workspace ${workspace.name}`);
                        }}
                    >
                        {workspace.displayName || workspace.name}
                    </button>
                {/each}
            </div>
            <div class="flex items-center">
                <div class="w-px h-3 bg-outline-variant"></div>
            </div>
            {#if outputs.glazewm.focusedContainer && outputs.glazewm.focusedContainer.type === 'window'}
                {@const container = outputs.glazewm.focusedContainer}
                <div class="flex items-center gap-2 max-w-96 overflow-auto">
                    <div
                        class="bg-secondary-container text-on-secondary-container px-2 text-sm rounded-md"
                    >
                        {container.processName.toLocaleLowerCase()}
                    </div>
                    <div class="text-secondary">
                        {container.title}
                    </div>
                </div>
                <div class="flex items-center">
                    <div class="w-px h-3 bg-outline-variant"></div>
                </div>
            {/if}
        {/if}
        {#if outputs.media?.currentSession}
            <div
                class="flex items-center hover:bg-secondary-container hover:text-on-secondary-container has-[>button:active]:bg-secondary-container/40 rounded-md transition"
            >
                <button
                    type="button"
                    class="flex items-center gap-2 focus:outline-none px-2 py-1"
                    onclick={() => {
                        expandMedia = !expandMedia;
                    }}
                >
                    <ListMusic />
                    <span class="max-w-64 overflow-auto">
                        {outputs.media.currentSession.artist} - {outputs.media
                            .currentSession.title}
                    </span>
                </button>
                {#if expandMedia}
                    <div
                        class="flex items-center starting:w-0 starting:-translate-x-2 starting:opacity-0 transition-[width,translate,opacity] [interpolate-size:allow-keywords] duration-200 pr-2 py-1"
                    >
                        <button
                            onclick={() => {
                                outputs.media?.previous();
                            }}
                            class="block hover:text-primary px-1"
                        >
                            <SkipBack />
                        </button>
                        {#if outputs.media.currentSession.isPlaying}
                            <button
                                onclick={() => {
                                    outputs.media?.pause();
                                }}
                                class="block hover:text-primary px-1"
                            >
                                <Pause />
                            </button>
                        {:else}
                            <button
                                onclick={() => {
                                    outputs.media?.play();
                                }}
                                class="block hover:text-primary px-1"
                            >
                                <Play />
                            </button>
                        {/if}
                        <button
                            onclick={() => {
                                outputs.media?.next();
                            }}
                            class="block hover:text-primary px-1"
                        >
                            <SkipForward />
                        </button>
                    </div>
                {/if}
            </div>
            <div class="flex items-center gap-4">
                <div class="w-px h-3 bg-outline-variant"></div>
            </div>
        {/if}
    </div>
    <div class="flex items-center">
        {#if outputs.date}
            <button type="button">
                {outputs.date?.formatted}
            </button>
        {/if}
    </div>

    <div class="flex-1 flex justify-end gap-4">
        <div class="flex items-center gap-4">
            <div class="w-px h-3 bg-outline-variant"></div>
        </div>
        {#if outputs.cpu}
            <div class="flex items-center gap-2">
                <CPU />
                <span>{Math.round(outputs.cpu.usage * 10) / 10}%</span>
            </div>
            <div class="flex items-center">
                <div class="w-px h-3 bg-outline-variant"></div>
            </div>
        {/if}

        {#if outputs.battery}
            <div class="flex items-center gap-2">
                {#if outputs.battery.isCharging}
                    <BatteryCharging />
                {:else if outputs.battery.chargePercent > 80}
                    <BatteryFull />
                {:else if outputs.battery.chargePercent > 20}
                    <BatteryMedium />
                {:else}
                    <BatteryLow />
                {/if}
                <span>{outputs.battery.chargePercent}%</span>
            </div>
            <div class="flex items-center">
                <div class="w-px h-3 bg-outline-variant"></div>
            </div>
        {/if}

        {#if outputs.memory}
            <div class="flex items-center gap-2">
                <MemoryStick />
                <span>
                    {Math.round(
                        (outputs.memory.usedMemory / 1024 / 1024 / 1024) * 100
                    ) / 100} GiB
                </span>
            </div>
            <div class="flex items-center">
                <div class="w-px h-3 bg-outline-variant"></div>
            </div>
        {/if}

        {#if outputs.audio?.defaultPlaybackDevice}
            {@const device = outputs.audio.defaultPlaybackDevice}
            <div
                class="flex items-center gap-4 px-2 py-1 hover:bg-secondary-container hover:text-on-secondary-container has-[>button:active]:bg-secondary-container/40 hover:text-primary rounded-md transition"
                onwheel={(e) => {
                    const audio = outputs.audio!;
                    const options = {
                        deviceId: device.deviceId,
                    };
                    if (e.deltaY > 0) {
                        const volume = Math.max(0, device.volume - 1);
                        audio.setVolume(volume, options);
                        if (volume === 0 && !device.isMuted) {
                            audio.setMute(true, options);
                        }
                    } else {
                        if (device.volume === 0 && device.isMuted) {
                            audio.setMute(false, options);
                        }
                        audio.setVolume(
                            Math.min(device.volume + 1, 100),
                            options
                        );
                    }
                }}
            >
                <button
                    type="button"
                    class="flex items-center gap-1"
                    onclick={() => {
                        expandAudio = !expandAudio;
                    }}
                >
                    {#if device.isMuted}
                        <VolumeMuted />
                    {:else if device.volume >= 50}
                        <VolumeHigh />
                    {:else if device.volume > 0}
                        <VolumeLow />
                    {:else}
                        <Volume />
                    {/if}
                    <span>{device.volume}</span>
                </button>
                {#if expandAudio}
                    <div
                        class="w-32 starting:w-0 starting:-translate-x-2 starting:opacity-0 transition-[width,translate,opacity] [interpolate-size:allow-keywords] duration-200"
                    >
                        <Slider
                            min={0}
                            max={100}
                            value={device.volume}
                            onInput={(value) => {
                                outputs.audio!.setVolume(value, {
                                    deviceId: device.deviceId,
                                });
                            }}
                        ></Slider>
                    </div>
                {/if}
            </div>
            <div class="flex items-center">
                <div class="w-px h-3 bg-outline-variant"></div>
            </div>
        {/if}

        {#if outputs.systray}
            <ul class="flex items-center">
                {#each outputs.systray.icons as icon (icon.id)}
                    <li class="shrink-0">
                        <button
                            type="button"
                            class="block opacity-60 hover:opacity-100 hover:scale-120 transition px-1"
                            onclick={(e) => {
                                e.preventDefault();
                                outputs.systray?.onLeftClick(icon.id);
                            }}
                            oncontextmenu={(e) => {
                                e.preventDefault();
                                outputs.systray?.onRightClick(icon.id);
                            }}
                        >
                            <img
                                src={icon.iconUrl}
                                alt={icon.tooltip}
                                title={icon.tooltip}
                                class="size-[16px]"
                            />
                        </button>
                    </li>
                {/each}
            </ul>
        {/if}
    </div>
</div>
