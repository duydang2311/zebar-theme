<script lang="ts">
    interface Props {
        min: number;
        max: number;
        value: number;
        onInput: (value: number) => void;
    }

    const { min, max, value, onInput }: Props = $props();

    function updateValue(event: PointerEvent) {
        const track = event.currentTarget as HTMLElement;
        const rect = track.getBoundingClientRect();
        const value = Math.min(
            max,
            Math.max(min, (event.clientX - rect.left) / rect.width)
        );
        onInput(Math.round(value * 100));
    }

    function handlePointerDown(event: PointerEvent) {
        const target = event.currentTarget as HTMLElement;

        target.setPointerCapture(event.pointerId);
        updateValue(event);
    }

    function handlePointerMove(event: PointerEvent) {
        if (!(event.buttons & 1)) return;

        updateValue(event);
    }
</script>

<div
    role="slider"
    tabindex="0"
    aria-valuemin={min}
    aria-valuemax={max}
    aria-valuenow={value}
    class="relative"
    onpointerdown={handlePointerDown}
    onpointermove={handlePointerMove}
>
    <div
        class="relative w-full h-1 bg-secondary/20 overflow-hidden rounded-full"
    >
        <div
            class="absolute inset-0 bg-secondary origin-left"
            style={`transform: translateX(-${100 - value}%);`}
        ></div>
    </div>
    <div
        data-active={value > 0 ? '' : undefined}
        class="absolute -bottom-2 left-0 w-px h-1 bg-secondary/20 data-active:bg-secondary/60"
    ></div>
    <div
        data-active={value >= 25 ? '' : undefined}
        class="absolute -bottom-2 left-1/4 w-px -translate-x-px h-1 bg-secondary/20 data-active:bg-secondary/60"
    ></div>
    <div
        data-active={value >= 50 ? '' : undefined}
        class="absolute -bottom-2 left-1/2 w-px -translate-x-px h-1 bg-secondary/20 data-active:bg-secondary/60"
    ></div>
    <div
        data-active={value >= 75 ? '' : undefined}
        class="absolute -bottom-2 left-3/4 w-px -translate-x-px h-1 bg-secondary/20 data-active:bg-secondary/60"
    ></div>
    <div
        data-active={value >= 100 ? '' : undefined}
        class="absolute -bottom-2 left-full w-px -translate-x-px h-1 bg-secondary/20 data-active:bg-secondary/60"
    ></div>
</div>
