<script lang="ts">
  export let teacher: any;
</script>

<div style="border:1px solid #eee;border-radius:8px;padding:12px;display:flex;gap:12px;align-items:center">
  <img src={teacher?.avatarUrl ?? 'https://placehold.co/48x48?text=T'} alt="avatar" width="48" height="48" style="border-radius:50%" />
  <div style="flex:1">
    <div style="font-weight:600">{teacher?.name ?? teacher?.user?.name ?? 'Unknown'}</div>
    <div style="color:#666;font-size:12px">
      {teacher?.profile?.regions?.join?.(', ') ?? teacher?.regions?.join?.(', ') ?? ''}
    </div>
  </div>
  <div style="text-align:right">
    <div style="color:#ff9800">{teacher?.profile?.rating ?? teacher?.rating ?? ''}</div>
  </div>
</div>

