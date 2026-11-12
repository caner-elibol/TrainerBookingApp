import 'package:flutter/material.dart';
import '../models/package_dtos.dart';
import '../services/api_client.dart';
import '../services/trainer_api.dart';

class PackagesScreen extends StatefulWidget {
  const PackagesScreen({super.key});

  @override
  State<PackagesScreen> createState() => _PackagesScreenState();
}

class _PackagesScreenState extends State<PackagesScreen> {
  final _trainerApi = TrainerApi();
  List<PackageItem> _packages = [];
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loading = true);
    try {
      final packages = await _trainerApi.getMyPackages();
      if (mounted) setState(() => _packages = packages);
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openForm({PackageItem? existing}) async {
    final saved = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (context) => _PackageForm(existing: existing, trainerApi: _trainerApi),
    );
    if (saved == true) _load();
  }

  Future<void> _deactivate(PackageItem package) async {
    try {
      await _trainerApi.deactivatePackage(package.id);
      _load();
    } on ApiException catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(e.message)));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Packages')),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _openForm(),
        child: const Icon(Icons.add),
      ),
      body: RefreshIndicator(
        onRefresh: _load,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : _packages.isEmpty
                ? ListView(children: const [Padding(padding: EdgeInsets.all(24), child: Text('No packages yet.'))])
                : ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: _packages.length,
                    itemBuilder: (context, index) {
                      final pkg = _packages[index];
                      return Card(
                        child: ListTile(
                          title: Text(pkg.title + (pkg.isActive ? '' : ' (inactive)')),
                          subtitle: Text('${pkg.sessionCount} sessions · ${pkg.price.toStringAsFixed(2)} TL'),
                          trailing: pkg.isActive
                              ? Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    IconButton(icon: const Icon(Icons.edit), onPressed: () => _openForm(existing: pkg)),
                                    IconButton(icon: const Icon(Icons.block), onPressed: () => _deactivate(pkg)),
                                  ],
                                )
                              : null,
                        ),
                      );
                    },
                  ),
      ),
    );
  }
}

class _PackageForm extends StatefulWidget {
  final PackageItem? existing;
  final TrainerApi trainerApi;
  const _PackageForm({required this.existing, required this.trainerApi});

  @override
  State<_PackageForm> createState() => _PackageFormState();
}

class _PackageFormState extends State<_PackageForm> {
  late final TextEditingController _title;
  late final TextEditingController _description;
  late final TextEditingController _sessionCount;
  late final TextEditingController _price;
  bool _isBusy = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    final e = widget.existing;
    _title = TextEditingController(text: e?.title ?? '');
    _description = TextEditingController(text: e?.description ?? '');
    _sessionCount = TextEditingController(text: (e?.sessionCount ?? 8).toString());
    _price = TextEditingController(text: (e?.price ?? 0).toString());
  }

  @override
  void dispose() {
    _title.dispose();
    _description.dispose();
    _sessionCount.dispose();
    _price.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() {
      _error = null;
      _isBusy = true;
    });

    final request = UpsertPackageRequest(
      title: _title.text.trim(),
      description: _description.text.trim(),
      sessionCount: int.tryParse(_sessionCount.text) ?? 0,
      price: double.tryParse(_price.text) ?? 0,
    );

    try {
      if (widget.existing == null) {
        await widget.trainerApi.createPackage(request);
      } else {
        await widget.trainerApi.updatePackage(widget.existing!.id, request);
      }
      if (mounted) Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      if (mounted) setState(() => _isBusy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).viewInsets.bottom + 16,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(widget.existing == null ? 'New package' : 'Edit package', style: const TextStyle(fontSize: 18)),
          const SizedBox(height: 12),
          TextField(controller: _title, decoration: const InputDecoration(labelText: 'Title')),
          const SizedBox(height: 8),
          TextField(controller: _description, decoration: const InputDecoration(labelText: 'Description')),
          const SizedBox(height: 8),
          TextField(
            controller: _sessionCount,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: 'Sessions'),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _price,
            keyboardType: const TextInputType.numberWithOptions(decimal: true),
            decoration: const InputDecoration(labelText: 'Price'),
          ),
          if (_error != null) ...[
            const SizedBox(height: 8),
            Text(_error!, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 16),
          FilledButton(onPressed: _isBusy ? null : _save, child: const Text('Save')),
        ],
      ),
    );
  }
}
